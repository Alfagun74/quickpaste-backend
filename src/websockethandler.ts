import { Logger } from "tslog";
import { Server, Socket } from "socket.io";
import { IQuickpaste, QuickpasteModel } from "./models/quickpaste.model";
import {
    postProcessQuickpaste,
    processQuickpaste,
} from "./quickpasteprocessor";

const log = new Logger();
export default class WebsocketHandler {
    sockets: Map<string, Socket> = new Map();
    io: Server;
    quickpasteCache: IQuickpaste[] = [];

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
        this.getQuickpastes();
    }

    addQuickpaste(quickpaste: IQuickpaste): void {
        const length = this.quickpasteCache.push(quickpaste);
        if (length > 5) {
            this.quickpasteCache.shift();
        }
    }

    async getQuickpastes(): Promise<IQuickpaste[]> {
        if (this.quickpasteCache.length > 0) {
            return this.quickpasteCache;
        } else if (process.env.NODE_ENV === "prod") {
            const databaseEntries = (
                await QuickpasteModel.find({
                    room: "Public",
                })
                    .sort({ createdAt: "desc" })
                    .limit(5)
                    .lean()
            ).reverse() as IQuickpaste[];
            this.quickpasteCache = databaseEntries;
            return databaseEntries;
        } else {
            return [];
        }
    }

    websocketHandler(socket: Socket): void {
        this.sockets.set(socket.id, socket);
        socket.join("Public");

        log.info(
            `Client ${socket.id} connected from ${socket.handshake.address}`
        );
        this.io.emit("onlinecount", this.sockets.size);

        socket.on("quickpaste", async (quickpaste: IQuickpaste) => {
            quickpaste.room = quickpaste.room ?? "Public";
            log.info(
                `(Room: ${quickpaste.room} Quickpaste received from client ${socket.id}: ${quickpaste.username}`,
                quickpaste.comment
            );
            quickpaste = await processQuickpaste(quickpaste);
            this.addQuickpaste(quickpaste);
            this.io.to(quickpaste.room).emit("quickpaste", quickpaste);
            postProcessQuickpaste(quickpaste);
            log.info(
                `(Room: ${quickpaste.room}) Quickpaste broadcasted from client ${socket.id}`
            );
        });

        socket.on("joinroom", (room: string) => {
            room = room ?? "Public";
            if (!room) return;
            socket.rooms.forEach((room) => {
                if (room !== socket.id) {
                    socket.leave(room);
                }
            });
            socket.join(room);
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
