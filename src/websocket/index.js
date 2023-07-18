import {WebSocketServer} from "ws";
import http from "http";

const players = [];
const rooms = [];

function addUser(ws, data, userId) {
  const { indexRoom: roomId } = JSON.parse(data);

  const room = findRoom(parseInt(roomId));
  const player = findPlayer(userId);

  if (findPlayerInCurrentRoom(room, userId)) {
    const response = {
      type: "error",
      data: {
        error: true,
        errorMessage: "user already in room",
      },
      index: 0,
    };

    player?.wsObject.send(JSON.stringify(response));
  } else {
    room?.players.push(player);
    updateRooms();
    createGame(room);
  }
}

function createGame(room) {
  const { players, id: roomId } = room;

  players.forEach(({ wsObject, playerId }) => {
    const response = {
      type: "create_game",
      data: JSON.stringify({
        idGame: roomId,
        idPlayer: playerId,
      }),
      id: 0,
    };
    wsObject.send(JSON.stringify(response), (err) => err && console.log(err));
  });
}

function createRoom(wsSended, data, userId) {
  const generateId = new Date().valueOf() + rooms.length;
  const user = findPlayer(userId);
  const roomPlayer = findPlayerInRoom(userId);

  // check for if user already create room
  if (roomPlayer) {
    const response = {
      type: "error",
      data: {
        name: userId.toString(),
        index: userId,
        error: true,
        errorText: "player already create room",
      },
      id: 0,
    };
    wsSended.send(JSON.stringify(response));
  } else {
    // add to rooms db new room
    rooms.push({
      id: generateId,
      players: [user],
    });
  }
}

function webSocketServer(wsPort) {
  const server = http.createServer();
const wss = new WebSocketServer({ noServer: true });
  server.listen(wsPort, () => {
    console.log(`WS_Server started on port ${wsPort}`);
  });

  wss.on("connection", (ws) => {
    const playerId = new Date().valueOf() + players.length;
    console.log(`A client connected with id:${playerId}`);

    ws.on("message", (message) => {
      try {
        const { type: messageType, data } = JSON.parse(message.toString());

        switch (messageType) {
          case "reg":
            registerPlayer(ws, data, playerId);
            updateRooms();
            break;
          case "create_room":
            createRoom(ws, data, playerId);
            updateRooms();
            break;
          case "add_user_to_room":
            addUser(ws, data, playerId);
            updateRooms();
            break;
          case "single_play":
            console.log("Received message:", messageType);
            console.log("Received message:", data);
            break;
          default:
            console.log("Unknown request type");
            ws.send("Unknown request type");
            break;
        }
      } catch (error) {
        console.log("error has been caught " + error);
      }
    });

    ws.on("close", () => {
      console.log("A client disconnected");
    });
  });

  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });
}

function isPlayerExists(name) {
  const filteredPlayers = players.filter((player) => player.name === name);
  return filteredPlayers.length > 0;
}

function registerPlayer(ws, dataReceived, playerId) {
  const parsedData = JSON.parse(dataReceived);
  const { name, password } = parsedData;

  if (!isPlayerExists(name)) {
    const newPlayer = { playerId, name, password, wsObject: ws };
    players.push(newPlayer);

    const response = {
      type: "reg",
      data: JSON.stringify({
        name,
        id: playerId,
        error: false,
        errorText: "",
      }),
      id: 0,
    };
    ws.send(JSON.stringify(response));
  } else {
    const message = `player with name: ${name} already exists`;
    const response = {
      type: "reg",
      data: {
        name,
        id: 0,
        error: true,
        errorText: message,
      },
      id: 0,
    };
    ws.send(JSON.stringify(response));
  }
}

function updateRooms() {
  players.forEach((player) => {
    const data = rooms.map((room) => {
      const roomId = room.id;
      const roomUsers = room.players.map((player) => ({
        index: player.playerId,
        name: player.name,
      }));
      return { roomId, roomUsers };
    });

    const response = {
      type: "update_room",
      data: JSON.stringify(data),
      id: 0,
    };

    player.wsObject.send(JSON.stringify(response));
  });
}
const findPlayer = (userId) =>
  players.find(({ playerId }) => playerId === userId);

const findPlayerInRoom = (userId) => {
  let result;
  rooms.forEach(({ players }) => {
    result = players.find(({ playerId }) => playerId === userId);
  });
  return result;
};

const findRoom = (roomId) => rooms.find(({ id }) => id === roomId);

const findPlayerInCurrentRoom = (room, userId) =>
  room?.players?.find((player) => player.playerId === userId);
export { webSocketServer };
