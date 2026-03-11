import { Router } from "express";
import {
  getAllFiles,
  getAllPrivateFiles,
  handleDeleteAllPublicImages,
  handleDeleteImage,
  handleGetbackGroundImage,
  handleGetProfileImages,
  handleSetAsBackground,
  SaveFile,
} from "../controllers/users/image.controller";
import multer from "multer";
import { multerStorage } from "../utils/utils";
import { UPLOAD_DIR } from "../utils/constant";

const imageRouter = Router();

const storage = multerStorage(UPLOAD_DIR);
const upload = multer({ storage });

imageRouter.route("/").post(upload.array("files"), SaveFile).get(getAllFiles);
imageRouter.route("/private").get(getAllPrivateFiles);
imageRouter.route("/background").get(handleGetbackGroundImage);
imageRouter.route("/delete-public").delete(handleDeleteAllPublicImages);
imageRouter.route("/public-data").get(handleGetProfileImages);
imageRouter.route("/delete-image/:id").delete(handleDeleteImage);
imageRouter.route("/set-background/:id").put(handleSetAsBackground);

export default imageRouter;
