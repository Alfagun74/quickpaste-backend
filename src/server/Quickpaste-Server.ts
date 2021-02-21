import { Logger } from "tslog";
import { nanoid } from "nanoid";
import prettyBytes from "pretty-bytes";
import express from "express";
import http from "http"
import { Server, Socket } from "socket.io";
import { start } from "repl";

const log = new Logger();
const port = 80;
const sockets: Map<string, Socket> = new Map();

function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);
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
    log.info(`Data received from client ${socket.id}`, data);
    if (sockets.size <= 1) {
      log.info(`Client ${socket.id} is alone.`);
      return;
    }
    sockets.forEach((socket: Socket, id: string) => {
      if (id != socket.id) {
        socket.emit("data", data);
        log.info(`Data sent from client ${socket.id} to client ${id}.`);
      }
    });
  });

  socket.on('end', function () {
    log.info(`Closing connection with client ${socket.id}`);
    sockets.delete(socket.id);
  });

  socket.on('error', (error: Error) => {
    log.error(`ERROR on client: ${socket.id}, ${socket.handshake.address} `, error.message);
  });
}

startServer();