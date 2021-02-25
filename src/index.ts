import { Logger } from "tslog";
import express, { Request, Response } from "express";
import http from "http"
import { Server, Socket } from "socket.io";
import { IQuickpaste, model } from "./quickpaste.model";
import LZString from "lz-string";
import { ImageTools } from "./imagetools";
import { customAlphabet } from "nanoid";
import path from "path"
import fs from "fs"
import date from 'date-and-time';
import database from "./database";

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
    pingTimeout: 15 * 60 * 10000,
    maxHttpBufferSize: 1e600
  });
  if (process.env.NODE_ENV === "prod") {
    app.get("/last", (req: Request, res: Response) => res.send());
  }
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

  socket.on("data", async (quickpaste: IQuickpaste) => {
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

async function processData(quickpaste: IQuickpaste): Promise<IQuickpaste> {
  const filename = `${date.format(new Date(), "YYYY-MM-DD_HH-mm-ss")}_ID-${nanoid()}`;
  log.info("Processsing Image:");
  // Set Timestamp
  quickpaste.timestamp = `${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}`;
  // Compress Image
  log.info("=> Decompressing DataUrl...");
  const HQImageDataUrlCompressed = quickpaste.img;
  const HQImageDataUrlUncompressed = LZString.decompressFromUTF16(HQImageDataUrlCompressed) ?? "";
  log.info("=> Converting DataUrl to Image...");
  log.info("=> Saving the Image...");
  const HQImageFilePath = ImageTools.getFileFromDataUrl(HQImageDataUrlUncompressed, filename, path.normalize(__dirname + "../../../uploads-full"));
  log.info("=> Compressing Image...");
  const LQImageFileUncompressed = await ImageTools.compress(path.normalize(__dirname + "../../../uploads-full" + HQImageFilePath), path.normalize(__dirname + "../../../uploads"));
  fs.rmSync(path.normalize(__dirname + "../../../uploads-full" + HQImageFilePath));
  quickpaste.size = ImageTools.getFilesize(LQImageFileUncompressed);
  log.info("=> Converting Image to DataUrl...");
  const LQImageDataUrlUncompressed = ImageTools.getDataUrlFromFile(LQImageFileUncompressed);
  log.info("=> Compressing DataUrl...");
  const LQImageDataUrlCompressed = LZString.compressToUTF16(LQImageDataUrlUncompressed)
  log.info("Image processed.");
  quickpaste.img = LQImageDataUrlCompressed;
  quickpaste.title = path.parse(LQImageFileUncompressed).base;
  new model({
    img: LQImageDataUrlCompressed,
    username: quickpaste.username,
    comment: quickpaste.comment,
    timestamp: quickpaste.timestamp,
    size: quickpaste.size,
    title: quickpaste.title,
  }).save().then(() => log.info("Image saved to Database."));

  // Calculate File-Size
  return quickpaste;
}

if (process.env.NODE_ENV === "prod") {
  database("mongodb://srv-captain--quickpaste-db/quickpaste").then(() => {
    startServer();
  })
} else {

  startServer();
}