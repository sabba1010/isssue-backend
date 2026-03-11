import { BackgroundTypeEnum, getCurrentUser } from "../../db/utils";
import { TryCatch } from "../../utils/try-catch";
import type { Express } from "express";
import { isFunctionDisable, removeFile, TError } from "../../utils/utils";
import { AudioModel } from "../../db/schema/audio.schema";
const SaveAudio = TryCatch(async (req, res) => {
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
    await AudioModel.create({
      name: fileName,
      url: filePath,
      setAsBackground: false,
      user: user?._id,
    });
  }
  res.json({ message: "Files uploaded successfully", url: urls });
});

const getAllPublicAudios = TryCatch(async (req, res) => {
  const musics = await AudioModel.find({ isPublic: true })
    .select("url setAsBackground")
    .sort({ createdAt: -1 });
  res.json({ musics });
});

const getAllPrivateAudios = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user) return res.json({ musics: [] });
  const musics = await AudioModel.find({ user: user?._id })
    .select("url setAsBackground")
    .sort({ createdAt: -1 });
  res.json({ musics });
});

const handleSetAsBackground = TryCatch(async (req, res) => {
  const id = req.params.id;
  const token = req.headers.authorization;
  const type = req.query.type as BackgroundTypeEnum;
  const [audio, user, isDisable] = await Promise.all([
    AudioModel.findById(id),
    getCurrentUser(token),
    isFunctionDisable("background"),
  ]);
  if (isDisable) return TError("Upload is disable", 400);
  if (!audio) return TError("Music not found", 404);
  if (type === BackgroundTypeEnum.PUBLIC) {
    await AudioModel.updateMany(
      { setAsBackground: true, user: null },
      { setAsBackground: false }
    );
  } else {
    await AudioModel.updateMany(
      { setAsBackground: true, user: user?._id },
      { setAsBackground: false }
    );
  }
  const updatedAudio = await AudioModel.findByIdAndUpdate(
    id,
    {
      setAsBackground: !audio.setAsBackground,
    },
    { new: true }
  );
  res.json({ message: "Music set as background successfully", updatedAudio });
});

const handleDeleteAudio = TryCatch(async (req, res) => {
  const isDisable = await isFunctionDisable("delete");
  if (isDisable) return TError("Delete is disable", 400);
  const id = req.params.id;
  const audio = await AudioModel.findById(id);
  if (!audio) return TError("Music not found", 404);
  if (audio.user) {
    const token = req.headers.authorization;
    const user = await getCurrentUser(token);
    if (user?._id.toString() !== audio.user.toString())
      return TError("Unauthorized", 401);
    const deleteAudio = await AudioModel.findByIdAndDelete(id);
    if (deleteAudio) {
      removeFile(deleteAudio?.name);
    }
    res.json({ message: "Music deleted successfully", deleteAudio });
  } else {
    // PUBLIC audio deletion - RESTRICT TO ADMIN
    const token = req.headers.authorization;
    const user = await getCurrentUser(token);
    if (!user?.roles.includes("admin"))
      return TError("You are not authorized to delete public content", 401);

    const deleteAudio = await AudioModel.findByIdAndDelete(id);
    if (deleteAudio) {
      removeFile(deleteAudio?.name);
    }
    res.json({ message: "Music deleted successfully", deleteAudio });
  }
});

const handleGetBackGroundAudio = TryCatch(async (req, res) => {
  const userId = req.query.user;
  if (!userId) {
    const audio = await AudioModel.findOne({
      setAsBackground: true,
      user: undefined,
    });
    res.json({ audio: audio?.url });
  } else {
    const audio = await AudioModel.findOne({
      setAsBackground: true,
      user: userId,
    });
    res.json({ audio: audio?.url });
  }
});

const handleDeleteAllPublicAudios = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user?.roles.includes("admin"))
    return TError("You are not authorized", 401);
  const musics = await AudioModel.find({
    $or: [{ user: null }, { user: undefined }],
  });
  musics.forEach((music) => {
    removeFile(music?.name);
  });
  await AudioModel.deleteMany({
    $or: [{ user: null }, { user: undefined }],
  });
  res.json({ message: "Musics deleted successfully" });
});

const handleUploadAsBackground = TryCatch(async (req, res) => {
  const file = req.file;
  if (!file) return TError("Please provide a file", 400);
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  const tab = req.query.tab;
  if (tab === "private") {
    await AudioModel.updateMany(
      { setAsBackground: true, user: user?._id },
      { setAsBackground: false }
    );
    const background = await AudioModel.create({
      name: file.filename,
      url: `${process.env.BASE_URL}/public/${file.filename}`,
      setAsBackground: true,
      user: user?._id,
    });
    res.json({ music: background, url: [background.url] });
    return;
  }
  await AudioModel.updateMany(
    { setAsBackground: true, user: null },
    { setAsBackground: false }
  );
  const background = await AudioModel.create({
    name: file.filename,
    url: `${process.env.BASE_URL}/public/${file.filename}`,
    setAsBackground: true,
  });
  res.json({ music: background, url: [background.url] });
});

const handleGetPrivateBackgroundAudio = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  const audio = await AudioModel.findOne({
    user: user?._id,
    setAsBackground: true,
  });
  res.json({ audio: audio?.url });
});

const handleGetProfileAudio = TryCatch(async (req, res) => {
  const userId = req.query.user;
  const audio = await AudioModel.find({ user: userId });
  res.json({ musics: audio });
});

export {
  SaveAudio,
  getAllPublicAudios,
  getAllPrivateAudios,
  handleDeleteAudio,
  handleSetAsBackground,
  handleGetBackGroundAudio,
  handleDeleteAllPublicAudios,
  handleUploadAsBackground,
  handleGetPrivateBackgroundAudio,
  handleGetProfileAudio,
};
