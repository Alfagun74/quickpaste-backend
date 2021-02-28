import fs from "fs";
import path from "path";
import mime from "mime";
import imagemin from "imagemin";
import imageminPngquant from "imagemin-pngquant";

const supportedMimeTypes: string[] = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg",
    "image/webp",
];

export class ImageTools {
    static getMimeTypeFromDataUrl(dataUrl: string): string {
        return dataUrl.substring(
            dataUrl.indexOf(":") + 1,
            dataUrl.indexOf(";")
        );
    }

    static isMimeTypeSupported(mimeType: string): boolean {
        return supportedMimeTypes.includes(mimeType);
    }

    static getFileFromDataUrl(
        dataUrl: string,
        filename: string,
        outputFolderPath: string
    ): string {
        const mimeType = this.getMimeTypeFromDataUrl(dataUrl);
        if (!this.isMimeTypeSupported(mimeType)) {
            throw Error("Unsupported Mime Type: " + mimeType);
        }
        const fileEnding = `.${mime.getExtension(mimeType)}`;
        const base64Data = dataUrl.split(";base64,").pop() ?? "";
        fs.writeFileSync(outputFolderPath + filename + fileEnding, base64Data, {
            encoding: "base64",
        });
        return filename + fileEnding;
    }

    static getDataUrlFromFile(filepath: string): string {
        const filemime = mime.getType(filepath);
        const data = fs.readFileSync(filepath, { encoding: "base64" });
        return `data:${filemime};name=${
            path.parse(filepath).base
        }.png;base64,${data}`;
    }

    static async compress(
        inputFilePath: string,
        outputFolderPath: string
    ): Promise<string> {
        return (
            await imagemin([inputFilePath], {
                destination: outputFolderPath,
                plugins: [imageminPngquant()],
                glob: false,
            })
        )[0].destinationPath;
    }

    static getFilesize(filepath: string): number {
        const stats = fs.statSync(filepath);
        return Math.round((stats.size / 1024 / 1024) * 100) / 100;
    }
}
