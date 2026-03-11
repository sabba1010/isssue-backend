import { BackgroundTypeEnum, getCurrentUser } from "../../db/utils";
import { TryCatch } from "../../utils/try-catch";
import type { Express } from "express";
import { isFunctionDisable, removeFile, TError } from "../../utils/utils";
import { GIFModel } from "../../db/schema/gif.schema";
import { BACKGROUN_STYLE } from "../../utils/types";
import { ImageModel } from "../../db/schema/images.schema";
import { VideoModel } from "../../db/schema/video.schema";

const SaveGIF = TryCatch(async (req, res) => {
  const isDisable = await isFunctionDisable("upload");
  if (isDisable) return TError("Upload is disable", 400);
  const files = req.files as Express.Multer.File[];
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!files?.length) return TError("No files provides", 400);
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i] as (typeof files)[0];
    const fileName = file.filename;
    const filePath = `${process.env.BASE_URL}/public/${fileName}`;
    urls.push(filePath);
    await GIFModel.create({
      name: fileName,
      url: filePath,
      setAsBackground: false,
      user: user?._id,
    });
  }
  res.json({ message: "Files uploaded successfully", url: urls });
});

const getAllPublicGIFS = TryCatch(async (req, res) => {
  const gifs = await GIFModel.find({ isPublic: true })
    .select("url setAsBackground style")
    .sort({ createdAt: -1 });
  res.json({ gifs });
});

const getAllPrivateGIFS = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user) return res.json({ gifs: [] });

  const gifs = await GIFModel.find({ user: user?._id })
    .select("url setAsBackground style")
    .sort({ createdAt: -1 });
  res.json({ gifs });
});

const handleSetAsBackground = TryCatch(async (req, res) => {
  const id = req.params.id;
  const token = req.headers.authorization;
  const type = req.query.type as BackgroundTypeEnum;
  const body = req.body.style as BACKGROUN_STYLE;
  const [user, gifs, isDisable] = await Promise.all([
    getCurrentUser(token),
    GIFModel.findById(id),
    isFunctionDisable("background"),
  ]);
  if (isDisable) return TError("Upload is disable", 400);
  if (!gifs) return TError("Gif not found", 404);
  if (type === BackgroundTypeEnum.PUBLIC) {
    await Promise.all([
      GIFModel.updateMany(
        { setAsBackground: true, user: null },
        { setAsBackground: false, style: null }
      ),
      ImageModel.updateMany(
        { setAsBackground: true, user: null },
        { setAsBackground: false, style: null }
      ),
      VideoModel.updateMany(
        { setAsBackground: true, user: null },
        { setAsBackground: false, style: null }
      ),
    ]);
  } else {
    await Promise.all([
      GIFModel.updateMany(
        { setAsBackground: true, user: user?._id },
        { setAsBackground: false, style: null }
      ),
      ImageModel.updateMany(
        { setAsBackground: true, user: user?._id },
        { setAsBackground: false, style: null }
      ),
      VideoModel.updateMany(
        { setAsBackground: true, user: user?._id },
        { setAsBackground: false, style: null }
      ),
    ]);
  }
  const updatedGifs = await GIFModel.findByIdAndUpdate(
    id,
    {
      setAsBackground: body === null ? false : true,
      style: body,
    },
    { new: true }
  );
  res.json({ message: "Gif set as background successfully", updatedGifs });
});

const handleDeleteGIF = TryCatch(async (req, res) => {
  const isDisable = await isFunctionDisable("delete");
  if (isDisable) return TError("Delete is disable", 400);
  const id = req.params.id;
  const gifs = await GIFModel.findById(id);
  if (!gifs) return TError("Gif not found", 404);
  if (gifs.user) {
    const token = req.headers.authorization;
    const user = await getCurrentUser(token);
    if (user?._id.toString() !== gifs.user.toString())
      return TError("Unauthorized", 401);
    const deleteGifs = await GIFModel.findByIdAndDelete(id);
    if (deleteGifs) {
      removeFile(deleteGifs?.name);
    }
    res.json({ message: "Gif deleted successfully", deleteGifs });
  } else {
    // PUBLIC GIF deletion - RESTRICT TO ADMIN
    const token = req.headers.authorization;
    const user = await getCurrentUser(token);
    if (!user?.roles.includes("admin"))
      return TError("You are not authorized to delete public content", 401);

    const deleteGifs = await GIFModel.findByIdAndDelete(id);
    if (deleteGifs) {
      removeFile(deleteGifs?.name);
    }
    res.json({ message: "Gif deleted successfully", deleteGifs });
  }
});

const handleGetBackGroundGIF = TryCatch(async (req, res) => {
  const userId = req.query.user;
  if (!userId) {
    const gifs = await GIFModel.findOne({
      setAsBackground: true,
      user: undefined,
    });
    res.json({ gifs: gifs });
  } else {
    const gifs = await GIFModel.findOne({
      setAsBackground: true,
      user: userId,
    });
    res.json({ gifs: gifs });
  }
});

const handleDeleteAllPublicGIF = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user?.roles.includes("admin"))
    return TError("You are not authorized", 401);
  const gifs = await GIFModel.find({
    $or: [{ user: null }, { user: undefined }],
  });
  gifs.forEach((gif) => {
    removeFile(gif?.name);
  });
  await GIFModel.deleteMany({
    $or: [{ user: null }, { user: undefined }],
  });
  res.json({ message: "Gifs deleted successfully" });
});

const handleGetProfileGif = TryCatch(async (req, res) => {
  const userId = req.query.user;
  const gifs = await GIFModel.find({ user: userId });
  res.json({ gifs });
});

export {
  handleSetAsBackground,
  SaveGIF,
  getAllPublicGIFS,
  getAllPrivateGIFS,
  handleDeleteGIF,
  handleGetBackGroundGIF,
  handleDeleteAllPublicGIF,
  handleGetProfileGif,
};
