import { Router } from "express";
import { multerStorage } from "../utils/utils";
import { UPLOAD_DIR } from "../utils/constant";
import multer from "multer";
import {
  getAllPrivateVideos,
  getAllPublicVideos,
  handleDeleteAllPublicVideo,
  handleDeleteVideo,
  handleGetBackGroundVideo,
  handleGetProfileVideo,
  handleSetAsBackground,
  SaveVideo,
} from "../controllers/users/video.controller";

const videoRouter = Router();

const storage = multerStorage(UPLOAD_DIR);
const upload = multer({ storage });

videoRouter
  .route("/")
  .post(upload.array("files"), SaveVideo)
  .get(getAllPublicVideos);
videoRouter.route("/private").get(getAllPrivateVideos);
videoRouter.route("/background").get(handleGetBackGroundVideo);
videoRouter.route("/delete-public").delete(handleDeleteAllPublicVideo);
videoRouter.route("/public-data").get(handleGetProfileVideo);
videoRouter.route("/delete-video/:id").delete(handleDeleteVideo);
videoRouter.route("/set-background/:id").put(handleSetAsBackground);

export default videoRouter;
