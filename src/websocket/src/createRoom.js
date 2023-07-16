const { WebSocket } = require("ws");
const { players, rooms } = require("./db/db");
const { findPlayer, findPlayerInRoom } = require("./utils");

function createRoom(wsSended, data, userId) {
  const generateId = new Date().valueOf() + rooms.length;
  const user = findPlayer(userId);
  const roomPlayer = findPlayerInRoom(userId);

  // Check if user already created a room
  if (roomPlayer) {
    const response = {
      type: "error",
      data: {
        name: userId.toString(),
        index: userId,
        error: true,
        errorText: "Player already created a room.",
      },
      id: 0,
    };
    wsSended.send(JSON.stringify(response));
  } else {
    // Add a new room to the rooms database
    rooms.push({
      id: generateId,
      players: [user],
    });
  }
}

module.exports = { createRoom };
