import { Router } from "express";
import {
  DeleteChat,
  GetAllChats,
  handleDeleteChat,
  SaveChat,
  UpdateChat,
} from "../controllers/users/chat.controller";
import {
  handleDeleteFileFromURL,
  handleuUploadFileAndGetUrl,
} from "../controllers/users/files.controller";
import { multerStorage } from "../utils/utils";
import { UPLOAD_DIR } from "../utils/constant";
import multer from "multer";

const chatRouter = Router();

const storage = multerStorage(UPLOAD_DIR);
const upload = multer({ storage });

chatRouter.route("/").get(GetAllChats).post(SaveChat).delete(DeleteChat);
chatRouter
  .route("/files")
  .post(upload.array("files"), handleuUploadFileAndGetUrl);
chatRouter.route("/files/:url").delete(handleDeleteFileFromURL);
chatRouter.route("/:id").put(UpdateChat).delete(handleDeleteChat);

export { chatRouter };
