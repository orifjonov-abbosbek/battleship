const { WebSocket } = require("ws");
const { findPlayer, findPlayerInCurrentRoom, findRoom } = require("./utils");
const { createGame } = require("./createGame");
const { updateRooms } = require("./updateRooms");

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

module.exports = { addUser };
