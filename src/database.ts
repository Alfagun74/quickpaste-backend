import mongoose from 'mongoose';
import { Logger } from "tslog";
const log = new Logger();

export default (connectionString: string) => {
    return new Promise<void>(async (resolve, reject) => {
        await mongoose.connect(
            connectionString, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        }).catch(err => {
            log.error(err);
            reject(err);
        });
        log.info("Connected to Database");
        resolve();
    });
}