const { players } = require("../database/db");

function isPlayerExists(name) {
  const filteredPlayers = players.filter((player) => player.name === name);
  return filteredPlayers[0] ? true : false;
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
    const message = `Player with name '${name}' already exists.`;
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

module.exports = { registerPlayer };
