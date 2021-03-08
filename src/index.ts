import database from "./database";
import WebsocketHandler from "./websockethandler";
import { Server } from "socket.io";
import { Logger } from "tslog";
import { loadLargeFile } from "./models/quickpaste.model";
import express, { Request, Response } from "express";
import { enc, Rabbit } from "crypto-js";
const log = new Logger();
const port = process.env.PORT ?? 80;
const app = express();
const secret = process.env.ENCRYPTION_SECRET;
let wshandler: WebsocketHandler;

if (process.env.NODE_ENV === "prod") {
    database(process.env.DB_HOST ?? "");
    app.get("/last", async (request: Request, response: Response) => {
        const databaseEntries = await wshandler.getQuickpastes();
        if (!secret) {
            throw Error("NO ENCRYPTION_SECRET SET");
        }
        await Promise.all(
            databaseEntries.map(async (quickpaste) => {
                delete quickpaste._id;
                delete quickpaste.createdAt;
                delete quickpaste.updatedAt;
                delete quickpaste._v;
                if (!quickpaste.title) {
                    throw Error("Quickpaste has got no title.");
                }
                const encryptedData = await loadLargeFile(quickpaste.title);
                if (!encryptedData) {
                    throw Error("Error loading File from DB");
                }
                const decryptedData = Rabbit.decrypt(encryptedData, secret);
                if (!decryptedData) {
                    throw Error("Error decrypting file");
                }
                quickpaste.img = decryptedData.toString(enc.Utf8);
                return quickpaste;
            })
        );
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
