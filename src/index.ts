import http from "http";

import express, { Request, Response } from "express";
import { Logger } from "tslog";
import database from "./database";
import WebsocketHandler from "./websockethandler";

const log = new Logger();
const port = 80;

let app;
let server: http.Server;

function startServer() {
    app = express();
    if (process.env.NODE_ENV === "prod") {
        database("mongodb://srv-captain--quickpaste-db:27017");
        app.get("/last", (req: Request, res: Response) => res.send());
    }
    server = http.createServer(app);

    server.listen(port, () => {
        log.info(
            `Server listening for connection requests on socket localhost: ${port}`
        );
        new WebsocketHandler(server);
    });

    server.on("error", (error: Error) => {
        log.error("ERROR on server", error.message);
    });
}

startServer();
