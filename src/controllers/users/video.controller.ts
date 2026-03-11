import { BackgroundTypeEnum, getCurrentUser } from "../../db/utils";
import { TryCatch } from "../../utils/try-catch";
import type { Express } from "express";
import { isFunctionDisable, removeFile, TError } from "../../utils/utils";
import { VideoModel } from "../../db/schema/video.schema";
import { ImageModel } from "../../db/schema/images.schema";
import { GIFModel } from "../../db/schema/gif.schema";
import { BACKGROUN_STYLE } from "../../utils/types";
const SaveVideo = TryCatch(async (req, res) => {
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
    await VideoModel.create({
      name: fileName,
      url: filePath,
      setAsBackground: false,
      user: user?._id,
    });
  }
  res.json({ message: "Files uploaded successfully", url: urls });
});

const getAllPublicVideos = TryCatch(async (req, res) => {
  const videos = await VideoModel.find({ isPublic: true })
    .select("url setAsBackground style")
    .sort({ createdAt: -1 });
  res.json({ videos });
});

const getAllPrivateVideos = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user) return res.json({ videos: [] });
  const videos = await VideoModel.find({ user: user?._id })
    .select("url setAsBackground style")
    .sort({ createdAt: -1 });
  res.json({ videos });
});

const handleSetAsBackground = TryCatch(async (req, res) => {
  const id = req.params.id;
  const type = req.query.type as BackgroundTypeEnum;
  const token = req.headers.authorization;
  const [video, user, isDisable] = await Promise.all([
    VideoModel.findById(id),
    getCurrentUser(token),
    isFunctionDisable("background"),
  ]);
  if (isDisable) return TError("Upload is disable", 400);
  if (!video) return TError("Video not found", 404);
  const body = req.body.style as BACKGROUN_STYLE;
  if (type === BackgroundTypeEnum.PUBLIC) {
    await Promise.all([
      VideoModel.updateMany(
        { setAsBackground: true, user: null },
        { setAsBackground: false, style: null }
      ),
      ImageModel.updateMany(
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
      VideoModel.updateMany(
        { setAsBackground: true, user: user?._id },
        { setAsBackground: false, style: null }
      ),
      ImageModel.updateMany(
        { setAsBackground: true, user: user?._id },
        { setAsBackground: false, style: null }
      ),
      GIFModel.updateMany(
        { setAsBackground: true, user: user?._id },
        { setAsBackground: false, style: null }
      ),
    ]);
  }
  const updatedVideo = await VideoModel.findByIdAndUpdate(
    id,
    {
      setAsBackground: body === null ? false : true,
      style: body,
    },
    { new: true }
  );
  res.json({ message: "Video set as background successfully", updatedVideo });
});

const handleDeleteVideo = TryCatch(async (req, res) => {
  const isDisable = await isFunctionDisable("delete");
  if (isDisable) return TError("Delete is disable", 400);
  const id = req.params.id;
  const video = await VideoModel.findById(id);
  if (!video) return TError("Video not found", 404);
  if (video.user) {
    const token = req.headers.authorization;
    const user = await getCurrentUser(token);
    if (user?._id.toString() !== video.user.toString())
      return TError("Unauthorized", 401);
    const deleteVideo = await VideoModel.findByIdAndDelete(id);
    if (deleteVideo) {
      removeFile(deleteVideo?.name);
    }
    res.json({ message: "Video deleted successfully", deleteVideo });
  } else {
    // PUBLIC video deletion - RESTRICT TO ADMIN
    const token = req.headers.authorization;
    const user = await getCurrentUser(token);
    if (!user?.roles.includes("admin"))
      return TError("You are not authorized to delete public content", 401);

    const deleteVideo = await VideoModel.findByIdAndDelete(id);
    if (deleteVideo) {
      removeFile(deleteVideo?.name);
    }
    res.json({ message: "Video deleted successfully", deleteVideo });
  }
});

const handleGetBackGroundVideo = TryCatch(async (req, res) => {
  const userId = req.query.user;
  if (!userId) {
    const video = await VideoModel.findOne({
      setAsBackground: true,
      user: undefined,
    });
    res.json({ video: video });
  } else {
    const video = await VideoModel.findOne({
      setAsBackground: true,
      user: userId,
    });
    res.json({ video: video });
  }
});

const handleDeleteAllPublicVideo = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user?.roles.includes("admin"))
    return TError("You are not authorized", 401);
  const video = await VideoModel.find({
    $or: [{ user: null }, { user: undefined }],
  });
  video.forEach((video) => {
    removeFile(video?.name);
  });
  await VideoModel.deleteMany({ $or: [{ user: null }, { user: undefined }] });
  res.json({ message: "Videos deleted successfully" });
});

const handleGetProfileVideo = TryCatch(async (req, res) => {
  const userId = req.query.user;
  const videos = await VideoModel.find({ user: userId });
  res.json({ videos });
});

export {
  SaveVideo,
  getAllPublicVideos,
  getAllPrivateVideos,
  handleSetAsBackground,
  handleDeleteVideo,
  handleGetBackGroundVideo,
  handleDeleteAllPublicVideo,
  handleGetProfileVideo,
};
