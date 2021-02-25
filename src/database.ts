import mongoose from "mongoose";
import { Logger } from "tslog";
const log = new Logger();

export default (connectionString: string): Promise<void | typeof mongoose> => {
    return mongoose.connect(connectionString,
        {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            authSource: "admin",
            auth: {
                user: "quickpaste",
                password: "DGkKXUW5eWnLK2QeEW2h"
            },
            dbName: "quickpaste",
            autoReconnect: true,
            autoCreate: true,
        }).catch(err => {
        log.error(err);
    });
};