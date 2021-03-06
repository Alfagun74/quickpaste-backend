import database from "./database";
import WebsocketHandler from "./websockethandler";
import { Server } from "socket.io";
import { Logger } from "tslog";
import {
    QuickpasteModel,
    loadLargeFile,
    IQuickpaste,
} from "./models/quickpaste.model";
import express, { Request, Response } from "express";
import { AES, ɵn } from "crypto-ts";
const log = new Logger();
const port = process.env.PORT ?? 80;
const app = express();
const secret = process.env.ENCRYPTION_SECRET;

if (process.env.NODE_ENV === "prod") {
    database(process.env.DB_HOST ?? "");
    app.get("/last", async (request: Request, response: Response) => {
        // eslint-disable-next-line prefer-const
        let databaseEntries: IQuickpaste[] = JSON.parse(
            JSON.stringify(
                await QuickpasteModel.find({
                    room: "Public",
                })
                    .sort({ createdAt: "desc" })
                    .limit(5)
                    .exec()
            )
        );
        if (!secret) {
            throw Error("NO ENCRYPTION_SECRET SET");
        }
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
            const decryptedData = AES.decrypt(encryptedData, secret);
            if (!decryptedData) {
                throw Error("Error decrypting file");
            }
            const decryptedDataString = decryptedData.toString(ɵn);
            quickpaste.img = decryptedDataString;
            console.log(quickpaste);
        });
        databaseEntries.reverse();
        response.json(databaseEntries).status(200);
    });
} else {
    app.get("/last", async (request: Request, response: Response) => {
        response.json([]).status(200);
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
