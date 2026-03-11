import { existsSync } from "fs";
import { TryCatch } from "../../utils/try-catch";
import type { Express } from "express";
import { removeFile, TError } from "../../utils/utils";
import path from "path";
import mongoose from "mongoose";

export const handleuUploadFileAndGetUrl = TryCatch(async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const filePaths = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i] as (typeof files)[0];
    const fileName = file.filename;
    const filePath = `${process.env.BASE_URL}/public/${fileName}`;
    filePaths.push(filePath);
  }
  res.json({ files: filePaths });
});

export const handleDeleteFileFromURL = TryCatch(async (req, res) => {
  const url = decodeURIComponent(req.params.url);
  const fileName = url.replace(`${process.env.BASE_URL}/public/`, "");
  const filePath = path.join(__dirname, "../../../uploads", fileName);
  const fileExists = existsSync(filePath);
  if (!fileExists) return TError("File not found", 404);
  const db = mongoose.connection.db;
  const collections = await db?.listCollections().toArray();
  collections?.forEach((collection) => {
    const name = collection.name;
    const call = db?.collection(name);
    if (name === "users") {
      call?.findOneAndUpdate({ profilePic: url }, { $set: { profilePic: "" } });
    } else {
      call?.findOneAndDelete({ url });
    }
  });
  removeFile(fileName);
  res.json({ message: `${fileName} deleted successfully` });
});

export default { handleuUploadFileAndGetUrl, handleDeleteFileFromURL };
