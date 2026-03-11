import { Router } from "express";
import { multerStorage } from "../utils/utils";
import { UPLOAD_DIR } from "../utils/constant";
import multer from "multer";
import {
  getAllPrivateAudios,
  getAllPublicAudios,
  handleDeleteAllPublicAudios,
  handleDeleteAudio,
  handleGetBackGroundAudio,
  handleGetPrivateBackgroundAudio,
  handleGetProfileAudio,
  handleSetAsBackground,
  handleUploadAsBackground,
  SaveAudio,
} from "../controllers/users/audio.controllers";

const audioRouter = Router();

const storage = multerStorage(UPLOAD_DIR);
const upload = multer({ storage });

audioRouter
  .route("/")
  .post(upload.array("files"), SaveAudio)
  .get(getAllPublicAudios);
audioRouter.route("/private").get(getAllPrivateAudios);
audioRouter.route("/background").get(handleGetBackGroundAudio);
audioRouter.route("/delete-public").delete(handleDeleteAllPublicAudios);
audioRouter
  .route("/upload-as-bacground")
  .post(upload.single("files"), handleUploadAsBackground)
  .get(handleGetPrivateBackgroundAudio);
audioRouter.route("/public-data").get(handleGetProfileAudio);
audioRouter.route("/delete-audio/:id").delete(handleDeleteAudio);
audioRouter.route("/set-background/:id").put(handleSetAsBackground);

export default audioRouter;
