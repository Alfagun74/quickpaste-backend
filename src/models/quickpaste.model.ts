import mongoose, { Schema, Document } from "mongoose";
import Grid from "gridfs-stream";
import streamToString from "stream-to-string";

let grid: Grid.Grid;

interface IQuickpaste extends Document {
    _id?: string;
    createdAt?: string;
    updatedAt?: string;
    _v?: string;
    img: string;
    username: string;
    comment?: string;
    timestamp?: string;
    size?: number;
    title?: string;
    room: string;
}

const QuickpasteSchema = new Schema({
    username: { type: Schema.Types.String, required: true },
    comment: { type: Schema.Types.String, required: false },
    timestamp: { type: Schema.Types.String, required: true },
    size: { type: Schema.Types.Number, required: true },
    title: { type: Schema.Types.String, required: true },
    room: { type: Schema.Types.String, required: true },
});
QuickpasteSchema.set("timestamps", true);

const QuickpasteModel = mongoose.model<IQuickpaste>(
    "Quickpaste",
    QuickpasteSchema
);

function setupLargeFile(): void {
    grid = Grid(mongoose.connection.db, mongoose.mongo);
}

function saveLargeFile(data: string, name: string): void {
    if (!grid) {
        throw "Call the Setup Method to use Large Files.";
    }
    const writestream = grid.createWriteStream({
        filename: name,
        mode: "w",
        content_type: "text/plain",
    });
    writestream.write(data);
    writestream.end();
}

async function loadLargeFile(name: string): Promise<string> {
    if (!grid) {
        throw "Call the Setup Method to use Large Files.";
    }
    return await streamToString(grid.createReadStream({ filename: name }));
}

export {
    IQuickpaste,
    QuickpasteModel,
    QuickpasteSchema,
    setupLargeFile,
    saveLargeFile,
    loadLargeFile,
};
