import http from "http";

import { Logger } from "tslog";
import { Server, Socket } from "socket.io";
import { IQuickpaste } from "./models/quickpaste.model";
import { processData } from "./quickpasteprocessor";

const log = new Logger();
export default class WebsocketHandler {
    sockets: Map<string, Socket> = new Map();
    io: Server;

    constructor(server: http.Server) {
        this.io = new Server(server, {
            pingTimeout: 15 * 60 * 10000,
            maxHttpBufferSize: 1e600,
        });
        this.io.of("/").adapter.on("create-room", (room) => {
            console.log(`Room ${room} was created`);
        });
        this.io.of("/").adapter.on("delete-room", (room) => {
            console.log(`Room ${room} was deleted`);
        });
        this.io.of("/").adapter.on("join-room", (room, id) => {
            console.log(`Socket ${id} has joined room ${room}`);
        });
        this.io.of("/").adapter.on("leave-room", (room, id) => {
            console.log(`Socket ${id} has left room ${room}`);
        });
        this.io.on("connection", this.websocketHandler);
    }

    websocketHandler(socket: Socket): void {
        this.sockets.set(socket.id, socket);
        socket.join("public");

        log.info(
            `Client ${socket.id} connected from ${socket.handshake.address}`
        );
        this.io.emit("onlinecount", this.sockets.size);

        socket.on("quickpaste", async (quickpaste: IQuickpaste) => {
            log.info(
                `Quickpaste received from client ${socket.id}: ${quickpaste.username}`,
                quickpaste.comment
            );
            quickpaste = await processData(quickpaste);
            this.io.to(quickpaste.room).emit("data", quickpaste);
            log.info(`Data broadcasted from client ${socket.id}`);
        });

        socket.on("joinroom", (roomcode: string) => {
            socket.rooms.forEach((room) => {
                if (room !== "public" || room !== socket.id) {
                    socket.leave(room);
                }
            });
            socket.join(roomcode);
            log.info(`Client ${socket.id} connected to room ${roomcode}`);
        });

        socket.on("disconnect", () => {
            this.sockets.delete(socket.id);
            this.io.emit("onlinecount", this.sockets.size);
            log.info(`Client ${socket.id} closed connection`);
        });

        socket.on("error", (error: Error) => {
            log.error(
                `ERROR on client: ${socket.id}, ${socket.handshake.address} `,
                error.message
            );
        });
    }
}
