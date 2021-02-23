import { Logger } from "tslog";
import express from "express";
import http from "http"
import { Server, Socket } from "socket.io";
import { Quickpaste } from "../models/Quickpaste";
import LZString from "lz-string";
import { ImageTools } from "./Imagetools";
import { customAlphabet } from "nanoid";
import path from "path"
import fs from "fs"
import date from 'date-and-time';

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 4);

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
    pingTimeout: 300000,
    maxHttpBufferSize: 1e600
  });
  // example on how to serve a simple API
  //app.get("/random", (req, res) => res.send(generateRandomNumber()));
  // example on how to serve static files from a given folder
  //app.use(express.static("public"));
  io.on("connection", onNewWebsocketConnection);
  server.listen(port, () => log.info(`Server listening for connection requests on socket localhost: ${port}`));
  server.on('error', (error: Error) => {
    log.error(`ERROR on server`, error.message);
  });
}

function onNewWebsocketConnection(socket: Socket) {
  sockets.set(socket.id, socket);
  log.info(`Client ${socket.id} connected from ${socket.handshake.address}`);
  io.emit("onlinecount", sockets.size);

  socket.on("data", async (quickpaste: Quickpaste) => {
    log.info(`Data received from client ${socket.id}: ${quickpaste.username}`, quickpaste.comment);
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
  const filename = `${date.format(new Date(), "YYYY-MM-DD-HH-mm-ss")}_ID-${nanoid()}`;
  log.info("Processsing Image:");
  // Set Timestamp
  quickpaste.timestamp = `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`;
  // Compress Image
  log.info("=> Decompressing DataUrl...");
  const HQImageDataUrlCompressed = quickpaste.img;
  const HQImageDataUrlUncompressed = LZString.decompressFromUTF16(HQImageDataUrlCompressed) ?? "";
  log.info("=> Converting DataUrl to Image...");
  log.info("=> Saving the Image...");
  const HQImageFilePath = ImageTools.getFileFromDataUrl(HQImageDataUrlUncompressed, filename, path.normalize(__dirname + "../../../uploads/full/"));
  log.info("=> Compressing Image...");
  const LQImageFileUncompressed = await ImageTools.compress(path.normalize(__dirname + "../../../uploads/full/" + HQImageFilePath), path.normalize(__dirname + "../../../uploads/"));
  fs.rmSync(path.normalize(__dirname + "../../../uploads/" + HQImageFilePath));
  quickpaste.size = ImageTools.getFilesize(LQImageFileUncompressed);
  log.info("=> Converting Image to DataUrl...");
  const LQImageDataUrlUncompressed = ImageTools.getDataUrlFromFile(LQImageFileUncompressed);
  log.info("=> Compressing DataUrl...");
  const LQImageDataUrlCompressed = LZString.compressToUTF16(LQImageDataUrlUncompressed)
  log.info("Image processed.");
  quickpaste.img = LQImageDataUrlCompressed;

  // Calculate File-Size
  return quickpaste;
}

startServer();