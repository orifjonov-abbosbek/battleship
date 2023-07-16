import { players } from "./db/db";

function findPlayer(playerId) {
  return players.find((player) => player.playerId === playerId) || null;
}


export default findPlayer;