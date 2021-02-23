import { Logger } from "tslog";
import express from "express";
import http from "http"
import { Server, Socket } from "socket.io";
import { Quickpaste } from "../models/Quickpaste";
import LZString from "lz-string";
import { ImageTools } from "./Imagetools";

global.atob = require("atob");
global.Blob = require("node-blob");
global.FileReader = require("filereader");

const options = {
  maxSizeMB: 8,
  useWebWorker: true,
};
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
  io.emit("onlinecount", sockets.size);

  socket.on("data", async (quickpaste: Quickpaste) => {
    log.info(`Data received from client ${socket.id}:${quickpaste.username}`, quickpaste.comment);
    quickpaste = await processData(quickpaste);
    if (sockets.size <= 1) {
      log.info(`Client ${socket.id} is alone.`);
    }
    io.emit("data", quickpaste);
    log.info(`Data broadcasted from client ${socket.id}`);
  });

  socket.on('disconnect', function () {
    log.info(`Closing connection with client ${socket.id}`);
    sockets.delete(socket.id);
    io.emit("onlinecount", sockets.size);
  });

  socket.on('error', (error: Error) => {
    log.error(`ERROR on client: ${socket.id}, ${socket.handshake.address} `, error.message);
  });


}

async function processData(quickpaste: Quickpaste): Promise<Quickpaste> {
  // Set Timestamp
  quickpaste.timestamp = `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`;

  // Compress Image
  const HQImageDataUrlCompressed = quickpaste.img
  const HQImageDataUrlUncompressed = LZString.decompressFromUTF16(HQImageDataUrlCompressed) ?? "";
  const HQImageFile = await ImageTools.getFilefromDataUrl(
    HQImageDataUrlUncompressed,
    `${quickpaste.timestamp}.png`
  );
  //TODO: COMPRESSconst LQImageFileUncompressed = await imageCompression(HQImageFile, options);
  const LQImageDataUrlUncompressed = await ImageTools.getDataUrlFromFile(HQImageFile);
  const LQImageDataUrlCompressed = LZString.compressToUTF16(LQImageDataUrlUncompressed)
  quickpaste.img = LQImageDataUrlCompressed;

  // Calculate File-Size
  quickpaste.size = `${(HQImageFile.size / 1024 / 1024).toFixed(
    1
  )} MB`;
  return quickpaste;
}

startServer();