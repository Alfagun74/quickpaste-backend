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
    }

    websocketHandler(socket: Socket): void {
        this.sockets.set(socket.id, socket);
        socket.join("public");

        this.log.info(
            `Client ${socket.id} connected from ${socket.handshake.address}`
        );
        this.io.emit("onlinecount", this.sockets.size);

        socket.on("quickpaste", async (quickpaste: IQuickpaste) => {
            this.log.info(
                `Quickpaste received from client ${socket.id}: ${quickpaste.username}`,
                quickpaste.comment
            );
            quickpaste = await processData(quickpaste);
            this.io.to(quickpaste.room).emit("data", quickpaste);
            this.log.info(`Data broadcasted from client ${socket.id}`);
        });

        socket.on("joinroom", (roomcode: string) => {
            socket.rooms.forEach((room) => {
                if (room != "public") {
                    socket.leave(room);
                }
            });
            socket.join(roomcode);
            this.log.info(`Client ${socket.id} connected to room ${roomcode}`);
        });

        socket.on("leaveroom", (roomcode: string) => {
            if (roomcode !== "public") {
                socket.leave(roomcode);
            }
            this.log.info(`Client ${socket.id} connected to room ${roomcode}`);
        });

        socket.on("disconnect", () => {
            this.sockets.delete(socket.id);
            this.io.emit("onlinecount", this.sockets.size);
            this.log.info(`Client ${socket.id} closed connection`);
        });

        socket.on("error", (error: Error) => {
            this.log.error(
                `ERROR on client: ${socket.id}, ${socket.handshake.address} `,
                error.message
            );
        });
    }
}
