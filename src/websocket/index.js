import {  WebSocketServer } from "ws";

const playersDB = [];
const roomsDB = new Map();

const webSocketServer = new WebSocketServer({ noServer: true });

function sendMessage(socket, message) {
  socket.send(JSON.stringify(message));
}

function sendPersonalResponse(client, result) {
  const response = {
    type: "personal_response",
    result: result,
  };
  sendMessage(client, response);
}

function sendResponseForRoom(roomId, response) {
  const room = roomsDB.get(roomId);
  if (room) {
    room.players.forEach((player) => {
      sendMessage(player, response);
    });
  }
}

function sendResponseForAll(response) {
  webSocketServer.clients.forEach((client) => {
    sendMessage(client, response);
  });
}

function handlePlayerRegistration(client, payload) {
  const { name, password } = payload;
  const player = playersDB.find((player) => player.name === name);
  if (player) {
    if (player.password === password) {
      sendPersonalResponse(client, "success");
    } else {
      sendPersonalResponse(client, "failure");
    }
  } else {
    playersDB.push({ name, password });
    sendPersonalResponse(client, "success");
  }
}

function handleCreateRoom(client) {
  const roomId = Math.random().toString(36).substr(2, 9);
  const roomUsers = [{ name: client.name }];
  roomsDB.set(roomId, { roomUsers });
  sendResponseForAll({
    type: "update_room",
    data: Array.from(roomsDB.values()),
  });
}

function handleAddUserToRoom(client, payload) {
  const { indexRoom } = payload;
  const room = Array.from(roomsDB.values())[indexRoom];
  if (room) {
    room.roomUsers.push({ name: client.name });
    sendResponseForAll({
      type: "update_room",
      data: Array.from(roomsDB.values()),
    });
    sendResponseForRoom(room.roomId, {
      type: "create_game",
      data: {
        idGame: room.roomId,
        idPlayer: room.roomUsers.length - 1,
      },
    });
  }
}

function handleAddShips(client, payload) {
  const { gameId, ships, indexPlayer } = payload;
  const room = roomsDB.get(gameId);
  if (room) {
    room.ships[indexPlayer] = ships;
    if (Object.keys(room.ships).length === 2) {
      room.currentPlayerIndex = 0;
      sendResponseForRoom(gameId, {
        type: "start_game",
        data: { ships: room.ships, currentPlayerIndex: 0 },
      });
      sendResponseForRoom(gameId, {
        type: "turn",
        data: { currentPlayer: 0 },
      });
    }
  }
}

function handleAttack(client, payload) {
  const { gameId, x, y, indexPlayer } = payload;
  const room = roomsDB.get(gameId);
  if (room) {
    if (indexPlayer === room.currentPlayerIndex) {
      const opponentIndex = indexPlayer === 0 ? 1 : 0;
      const opponentShips = room.ships[opponentIndex];
      let result = "miss";
      for (const ship of opponentShips) {
        const position = ship.find((pos) => pos.x === x && pos.y === y);
        if (position) {
          ship.hits.push(position);
          if (ship.hits.length === ship.length) {
            result = "killed";
            // Check if all opponent ships have been sunk
            if (opponentShips.every((s) => s.hits.length === s.length)) {
              sendResponseForRoom(gameId, {
                type: "finish",
                data: { winPlayer: indexPlayer },
              });
              return;
            }
          } else {
            result = "shot";
          }
          break;
        }
      }
      sendResponseForRoom(gameId, {
        type: "attack",
        data: {
          position: { x, y },
          currentPlayer: indexPlayer,
          status: result,
        },
      });
      if (result === "miss" || result === "killed") {
        room.currentPlayerIndex = opponentIndex;
      }
      sendResponseForRoom(gameId, {
        type: "turn",
        data: { currentPlayer: room.currentPlayerIndex },
      });
    }
  }
}

webSocketServer.on("connection", (client) => {
  console.log("WebSocket client connected");

  client.on("message", (message) => {
    const parsedMessage = JSON.parse(message);
    console.log("Received:", parsedMessage);

    switch (parsedMessage.type) {
      case "reg":
        handlePlayerRegistration(client, parsedMessage.data);
        break;
      case "create_room":
        handleCreateRoom(client);
        break;
      case "add_user_to_room":
        handleAddUserToRoom(client, parsedMessage.data);
        break;
      case "add_ships":
        handleAddShips(client, parsedMessage.data);
        break;
      case "attack":
        handleAttack(client, parsedMessage.data);
        break;
      default:
        console.log("Unknown message type:", parsedMessage.type);
    }
  });

  client.on("close", () => {
    console.log("WebSocket client disconnected");
    roomsDB.forEach((room, roomId) => {
      const index = room.roomUsers.findIndex(
        (user) => user.name === client.name
      );
      if (index !== -1) {
        room.roomUsers.splice(index, 1);
        if (room.roomUsers.length === 0) {
          roomsDB.delete(roomId);
          sendResponseForAll({
            type: "update_room",
            data: Array.from(roomsDB.values()),
          });
        }
      }
    });
  });
});

export { webSocketServer };
