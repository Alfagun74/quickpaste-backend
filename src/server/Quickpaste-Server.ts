import { Logger } from "tslog";
import express from "express";
import http from "http"
import { Server, Socket } from "socket.io";

const log = new Logger();
const port = 80;
const sockets: Map<string, Socket> = new Map();
let app;
let server: http.Server;
let io: Server;

function startServer() {
  app = express();
  server = http.createServer(app);
  io = new Server(server, {
    pingTimeout: 60000,
    pingInterval: 60000,
    maxHttpBufferSize: 1e600
  });
  // example on how to serve a simple API
  //app.get("/random", (req, res) => res.send(generateRandomNumber()));
  // example on how to serve static files from a given folder
  //app.use(express.static("public"));

  io.on("connection", onNewWebsocketConnection);
  server.listen(port, () => console.info(`Server listening for connection requests on socket localhost: ${port}`));
  server.on('error', (error: Error) => {
    log.error(`ERROR on server`, error.message);
  });
}

function onNewWebsocketConnection(socket: Socket) {
  sockets.set(socket.id, socket);
  log.info(`Client ${socket.id} connected from ${socket.handshake.address}`);

  socket.on("data", (data) => {
    log.info(`Data received from client ${socket.id}`, data.comment);

    if (sockets.size <= 1) {
      log.info(`Client ${socket.id} is alone.`);
    }

    io.emit("data", data);
    log.info(`Data broadcasted from client ${socket.id}`);
  });

  socket.on('error', (error: Error) => {
    log.error(`ERROR on client: ${socket.id}, ${socket.handshake.address} `, error.message);
  });
}

startServer();