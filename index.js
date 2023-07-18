import { httpServer } from "./src/http_server/index.js";
import {webSocketServer} from "./src/websocket/index.js";

const HTTP_PORT = 8181;
const WEBSOCKET_PORT = 3000;

console.log(`Start static HTTP server on port ${HTTP_PORT}!`);
httpServer.listen(HTTP_PORT);

console.log(`Start WebSocket server on port ${WEBSOCKET_PORT}!`);
webSocketServer(WEBSOCKET_PORT);
