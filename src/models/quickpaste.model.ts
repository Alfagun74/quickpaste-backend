import { GridFSBucket } from "mongodb";
import mongoose, { Schema, Document } from "mongoose";
import streamToString from "stream-to-string";

let EncryptedImage: GridFSBucket;

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
    EncryptedImage = new mongoose.mongo.GridFSBucket(mongoose.connection.db);
}

function saveLargeFile(data: string, name: string): void {
    if (!EncryptedImage) {
        throw "Call the Setup Method to use Large Files.";
    }
    const writestream = EncryptedImage.openUploadStream(name, {
        contentType: "text/plain",
    });
    writestream.write(data);
    writestream.end();
}

async function loadLargeFile(name: string): Promise<string> {
    if (!EncryptedImage) {
        throw "Call the Setup Method to use Large Files.";
    }
    return await streamToString(EncryptedImage.openDownloadStreamByName(name));
}

export {
    IQuickpaste,
    QuickpasteModel,
    QuickpasteSchema,
    setupLargeFile,
    saveLargeFile,
    loadLargeFile,
};
