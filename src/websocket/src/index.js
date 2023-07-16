const { WebSocket } = require("ws");
const http = require("http");
const { registerPlayer } = require("./register");
const { createRoom } = require("./createRoom");
const { players } = require("../database/db");
const { updateRooms } = require("./updateRooms");
const { addUser } = require("./addUser");

function webSocketServer(wsPort) {
  const server = http.createServer();
  const wss = new WebSocket.Server({ noServer: true });

  server.listen(wsPort, () => {
    console.log(`WS_Server started on port ${wsPort}`);
  });

  wss.on("connection", (ws) => {
    const playerId = new Date().valueOf() + players.length;
    console.log(`A client connected with id: ${playerId}`);

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
        console.log("Error has been caught:", error);
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

module.exports = { webSocketServer };
