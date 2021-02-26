import { Logger } from "tslog";
import { Server, Socket } from "socket.io";
import { IQuickpaste } from "./models/quickpaste.model";
import { processData } from "./quickpasteprocessor";

const log = new Logger();
export default class WebsocketHandler {
    sockets: Map<string, Socket> = new Map();
    io: Server;

    constructor(io: Server) {
        this.io = io;
        this.io.of("/").adapter.on("create-room", (room) => {
            log.info(`Room ${room} was created`);
        });
        this.io.of("/").adapter.on("delete-room", (room) => {
            log.info(`Room ${room} was deleted`);
        });
        this.io.of("/").adapter.on("join-room", (room, id) => {
            log.info(`Client ${id} has joined room ${room}`);
        });
        this.io.of("/").adapter.on("leave-room", (room, id) => {
            log.info(`Client ${id} has left room ${room}`);
        });
        this.io.on("connection", (data) => this.websocketHandler(data));
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
                `(Room: ${quickpaste.room} Quickpaste received from client ${socket.id}: ${quickpaste.username}`,
                quickpaste.comment,
            );
            quickpaste = await processData(quickpaste);
            this.io.to(quickpaste.room).emit("quickpaste", quickpaste);
            log.info(`(Room: ${quickpaste.room}) Quickpaste broadcasted from client ${socket.id}`);
        });

        socket.on("joinroom", (roomcode: string) => {
            if(!roomcode) return;
            socket.rooms.forEach((room) => {
                if (room !== "public" && room !== socket.id) {
                    socket.leave(room);
                }
            });
            socket.join(roomcode);
        });

        socket.on("disconnect", () => {
            this.sockets.delete(socket.id);
            this.io.emit("onlinecount", this.sockets.size);
            log.info(`Client ${socket.id} closed connection`);
        });

        socket.on("error", (error: Error) => {
            log.error(
                `Client Error: ${socket.id}, ${socket.handshake.address} `,
                error.message
            );
        });
    }
}
