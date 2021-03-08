import database from "./database";
import WebsocketHandler from "./websockethandler";
import { Server } from "socket.io";
import { Logger } from "tslog";
import express, { Request, Response } from "express";
const log = new Logger();
const port = process.env.PORT ?? 80;
const app = express();

let wshandler: WebsocketHandler;

if (process.env.NODE_ENV === "prod") {
    database(process.env.DB_HOST ?? "");
    app.get("/last", async (request: Request, response: Response) => {
        const databaseEntries = await wshandler.getQuickpastes();
        
        response.json(databaseEntries).status(200);
    });
} else {
    app.get("/last", async (request: Request, response: Response) => {
        response.json([]).status(200);
    });
}

const server = app.listen({ port: +port, host: "0.0.0.0" }, () => {
    wshandler = new WebsocketHandler(
        new Server(server, {
            pingTimeout: 15 * 60 * 10000,
            maxHttpBufferSize: 1e600,
        })
    );
    log.info(`Server listening for connection requests on port ${port}`);
});
