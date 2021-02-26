import database from "./database";
import WebsocketHandler from "./websockethandler";
import fastify from "fastify";
import { Server } from "socket.io";
import { Logger } from "tslog";

const log = new Logger();
const port = 80;

const app = fastify();
const io = new Server(app.server, {
    pingTimeout: 15 * 60 * 10000,
    maxHttpBufferSize: 1e600,
});

if (process.env.NODE_ENV === "prod") {
    database("mongodb://srv-captain--quickpaste-db:27017");
    app.get("/", (request, reply) => {
        reply.status(200);
    });
}

app.listen(80, () => {
    new WebsocketHandler(io);
    log.info(
        `Server listening for connection requests on socket localhost: ${port}`
    );
});
