import mongoose from "mongoose";
import { Logger } from "tslog";
import { setupLargeFile } from "./models/quickpaste.model";
const log = new Logger();

export default (connectionString: string): Promise<void | typeof mongoose> => {
    return mongoose
        .connect(connectionString, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            authSource: "admin",
            auth: {
                user: process.env.DB_USER ?? "",
                password: process.env.DB_PASS ?? "",
            },
            dbName: process.env.DB_NAME ?? "quickpaste",
            autoCreate: true,
        })
        .then(() => setupLargeFile())
        .catch((err: Error) => {
            log.error(err);
        });
};
