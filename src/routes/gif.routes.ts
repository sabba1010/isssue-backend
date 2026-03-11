import { Router } from "express";
import { multerStorage } from "../utils/utils";
import { UPLOAD_DIR } from "../utils/constant";
import multer from "multer";
import {
  getAllPrivateGIFS,
  getAllPublicGIFS,
  handleDeleteAllPublicGIF,
  handleDeleteGIF,
  handleGetBackGroundGIF,
  handleGetProfileGif,
  handleSetAsBackground,
  SaveGIF,
} from "../controllers/users/gif.controller";

const gifRouter = Router();

const storage = multerStorage(UPLOAD_DIR);
const upload = multer({ storage });

gifRouter.route("/").post(upload.array("files"), SaveGIF).get(getAllPublicGIFS);
gifRouter.route("/private").get(getAllPrivateGIFS);
gifRouter.route("/delete-public").delete(handleDeleteAllPublicGIF);
gifRouter.route("/background").get(handleGetBackGroundGIF);
gifRouter.route("/public-data").get(handleGetProfileGif);
gifRouter.route("/delete-gif/:id").delete(handleDeleteGIF);
gifRouter.route("/set-background/:id").put(handleSetAsBackground);

export default gifRouter;
