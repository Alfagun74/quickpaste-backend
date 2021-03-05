import date from "date-and-time";
import fs from "fs";
import path from "path";
import LZString from "lz-string";
import { Logger } from "tslog";
import { customAlphabet } from "nanoid";
import { ImageTools } from "./imagetools";
import { IQuickpaste, QuickpasteModel } from "./models/quickpaste.model";
import { AES } from "crypto-ts";

const log = new Logger();
const secret = process.env.ENCRYPTION_SECRET;

const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4);

export async function processData(
    quickpaste: IQuickpaste
): Promise<IQuickpaste> {
    log.info("📷 Processsing Image:");
    log.info("=> Preparing Metadata");
    const filename = `${date.format(
        new Date(),
        "YYYY-MM-DD_HH-mm-ss"
    )}_ID-${nanoid()}`;
    quickpaste.timestamp = `${new Date().toLocaleDateString(
        "de-DE"
    )} - ${new Date().toLocaleTimeString("de-DE")} Uhr`;
    log.info("=> Decompressing DataUrl");
    const HQImageDataUrlCompressed = quickpaste.img;
    const HQImageDataUrlUncompressed =
        LZString.decompressFromUTF16(HQImageDataUrlCompressed) ?? "";
    log.info("=> Converting DataUrl to Image");
    const HQImageFilePath = ImageTools.getFileFromDataUrl(
        HQImageDataUrlUncompressed,
        filename,
        path.normalize(__dirname + "../../uploads-full/")
    );
    log.info("=> Compressing & Saving Image");
    const LQImageFileUncompressed = await ImageTools.compress(
        path.normalize(__dirname + "../../uploads-full/" + HQImageFilePath),
        path.normalize(__dirname + "../../uploads/")
    );
    log.info("=> Deleting Full-Size File");
    if (fs.existsSync(__dirname + "../../uploads-full/" + HQImageFilePath)) {
        fs.rmSync(
            path.normalize(__dirname + "../../uploads-full/" + HQImageFilePath)
        );
    }
    log.info("=> Calculating File Size");
    quickpaste.size = ImageTools.getFilesize(LQImageFileUncompressed);
    log.info("=> Converting Image to DataUrl");
    const LQImageDataUrlUncompressed = ImageTools.getDataUrlFromFile(
        LQImageFileUncompressed
    );
    log.info("=> Compressing DataUrl");
    const LQImageDataUrlCompressed = LZString.compressToUTF16(
        LQImageDataUrlUncompressed
    );
    if (quickpaste.room !== "public") {
        log.info("=> Deleting Private File");
        if (fs.existsSync(LQImageFileUncompressed)) {
            fs.rmSync(path.normalize(LQImageFileUncompressed));
        }
    }
    quickpaste.img = LQImageDataUrlCompressed;
    quickpaste.title = path.parse(LQImageFileUncompressed).base;
    if (process.env.NODE_ENV === "prod") {
        if (!secret) {
            throw Error("NO ENCRYPTION_SECRET SET.");
        }
        log.info("=> Saving Quickpaste to Database");
        await new QuickpasteModel({
            img: AES.encrypt(quickpaste.img, secret).toString(),
            username: quickpaste.username,
            comment: quickpaste.comment,
            timestamp: quickpaste.timestamp,
            size: quickpaste.size,
            title: quickpaste.title,
            room: quickpaste.room,
        }).save();
    }
    log.info("📷 Image processed");
    return quickpaste;
}
