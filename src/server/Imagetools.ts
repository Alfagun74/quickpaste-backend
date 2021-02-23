import { Logger } from "tslog";

import fs from "fs";
import path from "path"

import mime from "mime";
import imagemin from "imagemin";
import imageminPngquant from "imagemin-pngquant";

const supportedMimeTypes: string[] = ["image/jpeg", "image/png", "image/gif", "image/svg", "image/webp"];

export class ImageTools {
    static log = new Logger();

    static getMimeTypeFromDataUrl(dataUrl: string): string {
        return dataUrl.substring(dataUrl.indexOf(":") + 1, dataUrl.indexOf(";"))
    }

    static isMimeTypeSupported(mimeType: string): boolean {
        return supportedMimeTypes.includes(mimeType);
    }

    static getFileFromDataUrl(dataUrl: string, filename: string, outputFolderPath: string): string {
        const mimeType = this.getMimeTypeFromDataUrl(dataUrl);
        if (!this.isMimeTypeSupported(mimeType)) {
            throw Error("Unsupported Mime Type: " + mimeType);
        }
        const fileEnding = `.${mime.extension(mimeType)}`;
        const base64Data = dataUrl.split(';base64,').pop() ?? "";
        fs.writeFileSync(outputFolderPath + filename + fileEnding, base64Data, { encoding: 'base64' });
        return filename + fileEnding;
    }

    static getDataUrlFromFile(filepath: string): string {
        const filemime = mime.lookup(filepath);
        const data = fs.readFileSync(filepath, { encoding: 'base64' });
        return `data:${filemime};base64,${data}`;
    }

    static async compress(inputFilePath: string, outputFolderPath: string): Promise<string> {
        const res = await imagemin([inputFilePath], {
            destination: outputFolderPath,
            plugins: [
                imageminPngquant(),
            ],
            glob: false
        });
        return res[0].destinationPath;
    }

    static getFilesize(filepath: string) {
        var stats = fs.statSync(filepath);
        var fileSizeInBytes = stats.size;
        return `${(fileSizeInBytes / 1024 / 1024).toFixed(1)} MB`;
    }
}