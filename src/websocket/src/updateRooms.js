const { rooms, players } = require("../database/db");

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

module.exports = { updateRooms };
