import database from "./database";
import WebsocketHandler from "./websockethandler";
import { Server } from "socket.io";
import { Logger } from "tslog";
import { QuickpasteModel, loadLargeFile } from "./models/quickpaste.model";
import express, { Request, Response } from "express";
import { AES } from "crypto-ts";

const log = new Logger();
const port = process.env.PORT ?? 80;
const app = express();
const secret = process.env.ENCRYPTION_SECRET;

if (process.env.NODE_ENV === "prod") {
    database(process.env.DB_HOST ?? "");
    app.get("/last", async (request: Request, response: Response) => {
        const quickpastes = await QuickpasteModel.find({ room: "Public" })
            .sort({ createdAt: "desc" })
            .limit(5)
            .exec();
        if (!secret) {
            throw Error("NO ENCRYPTION_SECRET SET");
        }
        quickpastes.map(async (quickpaste) => {
            delete quickpaste._id;
            delete quickpaste.createdAt;
            delete quickpaste.updatedAt;
            delete quickpaste._v;
            if (!quickpaste.title) {
                throw Error("Quickpaste has got no title.");
            }
            const decryptedData = AES.decrypt(
                await loadLargeFile(quickpaste.title),
                secret
            ).toString();
            quickpaste.img = decryptedData;
        });

        response.json(quickpastes.reverse()).status(200);
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
