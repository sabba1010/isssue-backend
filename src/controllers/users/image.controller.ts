import { GIFModel } from "../../db/schema/gif.schema";
import { ImageModel } from "../../db/schema/images.schema";
import { VideoModel } from "../../db/schema/video.schema";
import { BackgroundTypeEnum, getCurrentUser } from "../../db/utils";
import { TryCatch } from "../../utils/try-catch";
import { BACKGROUN_STYLE } from "../../utils/types";
import { isFunctionDisable, removeFile, TError } from "../../utils/utils";
import type { Express } from "express";

const SaveFile = TryCatch(async (req, res) => {
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
    await ImageModel.create({
      name: fileName,
      url: filePath,
      setAsBackground: false,
      user: user?._id,
    });
  }
  res.json({ message: "Fictures uploaded successfully", url: urls });
});

const getAllFiles = TryCatch(async (req, res) => {
  const images = await ImageModel.find({ isPublic: true })
    .select("url setAsBackground style")
    .sort({ createdAt: -1 });
  res.json({ images });
});

const getAllPrivateFiles = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user) return res.json({ images: [] });
  const images = await ImageModel.find({ user: user?._id })
    .select("url setAsBackground style")
    .sort({ createdAt: -1 });
  res.json({ images });
});

const handleSetAsBackground = TryCatch(async (req, res) => {
  const id = req.params.id;
  const type = req.query.type as BackgroundTypeEnum;
  if (!type) return TError("Background configuration not found", 404);
  const token = req.headers.authorization;
  const [file, user, isDisable] = await Promise.all([
    ImageModel.findById(id),
    getCurrentUser(token),
    isFunctionDisable("background"),
  ]);
  if (isDisable) return TError("Upload is disable", 400);
  if (!file) return TError("Image not found", 404);
  const body = req.body.style as BACKGROUN_STYLE;
  if (type === BackgroundTypeEnum.PUBLIC) {
    await Promise.all([
      ImageModel.updateMany(
        { setAsBackground: true, user: null },
        { setAsBackground: false, style: null }
      ),
      VideoModel.updateMany(
        { setAsBackground: true, user: null },
        { setAsBackground: false, style: null }
      ),
      GIFModel.updateMany(
        { setAsBackground: true, user: null },
        { setAsBackground: false, style: null }
      ),
    ]);
  } else {
    await Promise.all([
      ImageModel.updateMany(
        { setAsBackground: true, user: user?._id },
        { setAsBackground: false, style: null }
      ),
      VideoModel.updateMany(
        { setAsBackground: true, user: user?._id },
        { setAsBackground: false, style: null }
      ),
      GIFModel.updateMany(
        { setAsBackground: true, user: user?._id },
        { setAsBackground: false, style: null }
      ),
    ]);
  }
  const updatedImage = await ImageModel.findByIdAndUpdate(
    id,
    {
      setAsBackground: body === null ? false : true,
      style: body,
    },
    { new: true }
  );
  res.json({ message: "Image set as background successfully", updatedImage });
});

const handleDeleteImage = TryCatch(async (req, res) => {
  const isDisable = await isFunctionDisable("delete");
  if (isDisable) return TError("Delete is disable", 400);
  const id = req.params.id;
  const image = await ImageModel.findById(id);
  if (!image) return TError("Image not found", 404);
  if (image.user) {
    const token = req.headers.authorization;
    const user = await getCurrentUser(token);
    if (user?._id.toString() !== image.user.toString())
      return TError("Unauthorized", 401);
    const deleteImage = await ImageModel.findByIdAndDelete(id);
    if (deleteImage) {
      removeFile(deleteImage?.name);
    }
    res.json({ message: "Image deleted successfully", deleteImage });
  } else {
    // PUBLIC image deletion - RESTRICT TO ADMIN
    const token = req.headers.authorization;
    const user = await getCurrentUser(token);
    if (!user?.roles.includes("admin"))
      return TError("You are not authorized to delete public content", 401);

    const deleteImage = await ImageModel.findByIdAndDelete(id);
    if (deleteImage) {
      removeFile(deleteImage?.name);
    }
    res.json({ message: "Image deleted successfully", deleteImage });
  }
});

const handleGetbackGroundImage = TryCatch(async (req, res) => {
  const userId = req.query.user;
  if (!userId) {
    const image = await ImageModel.findOne({
      setAsBackground: true,
      user: undefined,
    });
    res.json({ image: image });
  } else {
    const image = await ImageModel.findOne({
      setAsBackground: true,
      user: userId,
    });
    res.json({ image: image });
  }
});

const handleDeleteAllPublicImages = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user?.roles.includes("admin"))
    return TError("You are not authorized", 401);
  const images = await ImageModel.find({
    $or: [{ user: null }, { user: undefined }],
  });
  images.forEach((image) => {
    removeFile(image?.name);
  });
  await ImageModel.deleteMany({ $or: [{ user: null }, { user: undefined }] });
  res.json({ message: "Images deleted successfully" });
});

const handleGetProfileImages = TryCatch(async (req, res) => {
  const userId = req.query.user;
  const images = await ImageModel.find({ user: userId });
  res.json({ images });
});

export {
  SaveFile,
  getAllFiles,
  getAllPrivateFiles,
  handleSetAsBackground,
  handleDeleteImage,
  handleGetbackGroundImage,
  handleDeleteAllPublicImages,
  handleGetProfileImages,
};
