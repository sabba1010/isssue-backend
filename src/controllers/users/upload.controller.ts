import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { UPLOAD_DIR } from "../../utils/constant";
import { TryCatch } from "../../utils/try-catch";
import { isFunctionDisable, TError } from "../../utils/utils";
import { VideoModel } from "../../db/schema/video.schema";
import { ImageModel } from "../../db/schema/images.schema";
import { AudioModel } from "../../db/schema/audio.schema";
import { GIFModel } from "../../db/schema/gif.schema";
import { getCurrentUser } from "../../db/utils";

const CHUNKS_DIR = path.join(UPLOAD_DIR, "chunks");

if (!fs.existsSync(CHUNKS_DIR)) {
  fs.mkdirSync(CHUNKS_DIR, { recursive: true });
}

export const initUpload = TryCatch(async (req: Request, res: Response) => {
  const isDisable = await isFunctionDisable("upload");
  if (isDisable) return TError("Upload is disabled", 400);

  const { fileName, totalChunks } = req.body;
  if (!fileName || !totalChunks) {
    return TError("fileName and totalChunks are required", 400);
  }

  const uploadId = `${Date.now()}-${fileName.replace(/ /g, "")}`;
  const chunkDir = path.join(CHUNKS_DIR, uploadId);

  if (!fs.existsSync(chunkDir)) {
    fs.mkdirSync(chunkDir, { recursive: true });
  }

  res.status(200).json({ uploadId, message: "Upload initialized" });
});

export const uploadChunk = TryCatch(async (req: Request, res: Response) => {
  const { uploadId, chunkIndex } = req.body;
  const chunkFile = req.file;

  if (!uploadId || chunkIndex === undefined || !chunkFile) {
    return TError("uploadId, chunkIndex and chunk are required", 400);
  }

  const chunkDir = path.join(CHUNKS_DIR, uploadId);
  if (!fs.existsSync(chunkDir)) {
    return TError("Upload session not found", 404);
  }

  const chunkPath = path.join(chunkDir, chunkIndex.toString());
  fs.renameSync(chunkFile.path, chunkPath);

  res.status(200).json({ message: `Chunk ${chunkIndex} uploaded` });
});

export const completeUpload = TryCatch(async (req: Request, res: Response) => {
  const { uploadId, fileName, totalChunks, fileType } = req.body;
  if (!uploadId || !fileName || !totalChunks) {
    return TError("uploadId, fileName, and totalChunks are required", 400);
  }

  const chunkDir = path.join(CHUNKS_DIR, uploadId);
  if (!fs.existsSync(chunkDir)) {
    return TError("Upload session not found", 404);
  }

  const finalFileName = `${uploadId}`;
  const finalPath = path.join(UPLOAD_DIR, finalFileName);
  const writeStream = fs.createWriteStream(finalPath);

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(chunkDir, i.toString());
    if (!fs.existsSync(chunkPath)) {
      writeStream.close();
      return TError(`Missing chunk ${i}`, 400);
    }
    const chunkData = fs.readFileSync(chunkPath);
    writeStream.write(chunkData);
    fs.unlinkSync(chunkPath);
  }

  writeStream.end();

  writeStream.on("finish", async () => {
    fs.rmSync(chunkDir, { recursive: true, force: true });

    const token = req.headers.authorization;
    const user = await getCurrentUser(token);
    const filePath = `${process.env.BASE_URL}/public/${finalFileName}`;

    // user._id => track who uploaded; isPublic: true => visible to everyone
    const ext = path.extname(fileName).toLowerCase();

    if (fileType === "video" || [".mp4", ".mov", ".mkv", ".webm"].includes(ext)) {
      await VideoModel.create({
        name: finalFileName,
        url: filePath,
        setAsBackground: false,
        user: user?._id,
        isPublic: true,
      });
    } else if (fileType === "image" || [".jpg", ".jpeg", ".png", ".webp", ".svg"].includes(ext)) {
      await ImageModel.create({
        name: finalFileName,
        url: filePath,
        setAsBackground: false,
        user: user?._id,
        isPublic: true,
      });
    } else if (fileType === "audio" || [".mp3", ".wav", ".ogg"].includes(ext)) {
      await AudioModel.create({
        name: finalFileName,
        url: filePath,
        setAsBackground: false,
        user: user?._id,
        isPublic: true,
      });
    } else if (fileType === "gif" || ext === ".gif") {
      await GIFModel.create({
        name: finalFileName,
        url: filePath,
        setAsBackground: false,
        user: user?._id,
        isPublic: true,
      });
    }

    res.status(200).json({
      message: "File upload completed successfully",
      url: [filePath]
    });
  });

  writeStream.on("error", (err) => {
    console.error("Error merging chunks:", err);
    res.status(500).json({ message: "Error merging chunks" });
  });
});
