import { createServer, Socket } from "net";
import { Logger } from "tslog";
import { nanoid } from "nanoid";
import prettyBytes from "pretty-bytes";

const log = new Logger();
const port = 80;
const server = createServer();
const sockets: Map<string, Socket> = new Map();

server.listen(port, () => {
  log.info(`Server listening for connection requests on socket localhost:${port}`);
});

server.on('error', (error: Error) => {
  log.fatal(`ERROR on Server`, error.message);
});

server.on('connection', (socket: Socket) => {
  socket.setDefaultEncoding("utf-8");
  socket.setEncoding("utf-8");
  socket.setKeepAlive(true);
  const socketId = nanoid();
  sockets.set(socketId, socket);
  log.info(`Client ${socketId} connected from ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on('data', (data: Buffer) => {
    log.info(`Data (${prettyBytes(data.buffer.byteLength ?? 0, {locale: 'de'})}) received from client: ${data.toString("utf-8")}`);
    if (sockets.size <= 1) {
      log.info(`Client ${socketId} is alone.`);
      return;
    }
    sockets.forEach((socket: Socket, id: string) => {
      if (id != socketId) {
        socket.write(data);
        log.info(`Data (${prettyBytes(data.buffer.byteLength ?? 0, {locale: 'de'})}) sent from client ${socketId} to client ${id}: ${data.toString("utf-8")}`);
      }
    });
  });

  socket.on('end', function () {
    log.info(`Closing connection with client ${socketId}`);
    sockets.delete(socketId);
  });

  socket.on('error', (error: Error) => {
    log.error(`ERROR on client: ${socketId}, ${socket.remoteAddress}:${socket.remotePort}`, error.message);
  });
});
