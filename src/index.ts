import database from "./database";
import WebsocketHandler from "./websockethandler";
import fastify from "fastify";
import { Server } from "socket.io";
import { Logger } from "tslog";

const log = new Logger();
const port = process.env.PORT ?? 80;
const app = fastify();

if (process.env.NODE_ENV === "prod") {
    database(process.env.DB_HOST ?? "");
    //app.get("/", (request, reply) => {
    //     reply.status(200);
    //});
}

app.listen({ port: +port, host: "0.0.0.0" }, (err: Error, address: string) => {
    if (err) throw err;
    new WebsocketHandler(
        new Server(app.server, {
            pingTimeout: 15 * 60 * 10000,
            maxHttpBufferSize: 1e600,
        })
    );
    log.info(
        `Server listening for connection requests on socket localhost: ${address}`
    );
});
