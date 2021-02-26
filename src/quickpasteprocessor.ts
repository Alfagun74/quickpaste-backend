import date from "date-and-time";
import fs from "fs";
import path from "path";
import LZString from "lz-string";
import { Logger } from "tslog";
import { customAlphabet } from "nanoid";
import { ImageTools } from "./imagetools";
import { IQuickpaste, QuickpasteModel } from "./models/quickpaste.model";

const log = new Logger();
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 4);

export async function processData(
    quickpaste: IQuickpaste
): Promise<IQuickpaste> {
    const filename = `${date.format(
        new Date(),
        "YYYY-MM-DD_HH-mm-ss"
    )}_ID-${nanoid()}`;
    log.info("Processsing Image:");
    quickpaste.timestamp = `${new Date().toLocaleDateString(
        "de-DE"
    )} - ${new Date().toLocaleTimeString("de-DE")} Uhr`;
    log.info("=> Decompressing DataUrl...");
    const HQImageDataUrlCompressed = quickpaste.img;
    const HQImageDataUrlUncompressed =
        LZString.decompressFromUTF16(HQImageDataUrlCompressed) ?? "";
    log.info("=> Converting DataUrl to Image...");
    log.info("=> Saving the Image...");
    const HQImageFilePath = ImageTools.getFileFromDataUrl(
        HQImageDataUrlUncompressed,
        filename,
        path.normalize(__dirname + "../../../uploads-full")
    );
    log.info("=> Compressing Image...");
    const LQImageFileUncompressed = await ImageTools.compress(
        path.normalize(__dirname + "../../../uploads-full" + HQImageFilePath),
        path.normalize(__dirname + "../../../uploads")
    );
    fs.rmSync(
        path.normalize(__dirname + "../../../uploads-full" + HQImageFilePath)
    );
    quickpaste.size = ImageTools.getFilesize(LQImageFileUncompressed);
    log.info("=> Converting Image to DataUrl...");
    const LQImageDataUrlUncompressed = ImageTools.getDataUrlFromFile(
        LQImageFileUncompressed
    );
    log.info("=> Compressing DataUrl...");
    const LQImageDataUrlCompressed = LZString.compressToUTF16(
        LQImageDataUrlUncompressed
    );
    log.info("Image processed");
    quickpaste.img = LQImageDataUrlCompressed;
    quickpaste.title = path.parse(LQImageFileUncompressed).base;
    new QuickpasteModel({
        img: LQImageDataUrlCompressed,
        username: quickpaste.username,
        comment: quickpaste.comment,
        timestamp: quickpaste.timestamp,
        size: quickpaste.size,
        title: quickpaste.title,
        room: quickpaste.room,
    })
        .save()
        .then(() => log.info("Image saved to Database"));
    return quickpaste;
}
