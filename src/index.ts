import database from "./database";
import WebsocketHandler from "./websockethandler";
import { Server } from "socket.io";
import { Logger } from "tslog";
import { QuickpasteModel } from "./models/quickpaste.model";
import express, { Request, Response } from "express";

const log = new Logger();
const port = process.env.PORT ?? 80;
const app = express();

if (process.env.NODE_ENV === "prod") {
    database(process.env.DB_HOST ?? "");
    app.get("/last/:roomcode", async (request: Request, response: Response) => {
        const roomCode: string = request.params.roomcode;
        const quickpastes = await QuickpasteModel.find(
            { room: roomCode },
            null,
            {
                limit: 10,
                sort: { _createdAt: -1 },
            }
        );
        response.json(quickpastes).status(200);
    });
}

const server = app.listen({ port: +port, host: "0.0.0.0" }, () => {
    new WebsocketHandler(
        new Server(server, {
            pingTimeout: 15 * 60 * 10000,
            maxHttpBufferSize: 1e600,
        })
    );
    log.info(`Server listening for connection requests on port ${port}`);
});
