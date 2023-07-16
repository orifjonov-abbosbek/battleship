
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
    wsObject.send(JSON.stringify(response), (err) => {
      if (err) {
        console.log(err);
      }
    });
  });
}

module.exports = { createGame };
