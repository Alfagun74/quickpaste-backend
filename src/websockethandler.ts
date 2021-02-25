import http from "http";

import { Logger } from "tslog";
import { Server, Socket } from "socket.io";
import { IQuickpaste } from "./models/quickpaste.model";
import { processData } from "./quickpasteprocessor";

export default class WebsocketHandler {
    log = new Logger();
    sockets: Map<string, Socket> = new Map();
    io: Server;

    constructor(server: http.Server) {
        this.io = new Server(server, {
            pingTimeout: 15 * 60 * 10000,
            maxHttpBufferSize: 1e600,
        });
        this.io.on("connection", this.websocketHandler);
    }

    websocketHandler(socket: Socket): void {
        this.sockets.set(socket.id, socket);
        this.log.info(
            `Client ${socket.id} connected from ${socket.handshake.address}`
        );
        this.io.emit("onlinecount", this.sockets.size);

        socket.on("data", async (quickpaste: IQuickpaste) => {
            this.log.info(
                `Data received from client ${socket.id}: ${quickpaste.username}`,
                quickpaste.comment
            );
            quickpaste = await processData(quickpaste);
            if (this.sockets.size <= 1) {
                this.log.info(`Client ${socket.id} is alone.`);
            }
            this.io.emit("data", quickpaste);
            this.log.info(`Data broadcasted from client ${socket.id}`);
        });

        socket.on("disconnect", () => {
            this.log.info(`Closing connection with client ${socket.id}`);
            this.sockets.delete(socket.id);
            this.io.emit("onlinecount", this.sockets.size);
        });

        socket.on("error", (error: Error) => {
            this.log.error(
                `ERROR on client: ${socket.id}, ${socket.handshake.address} `,
                error.message
            );
        });
    }
}
