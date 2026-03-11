import { Router } from "express";
import {
  handleDisableChat,
  handleDisableDelete,
  handleDisableMusic,
  handleDisbaleBackground,
  handleDisbaleUpload,
  handlegetDisableBackground,
  handlegetDisableChat,
  handlegetDisableDelete,
  handlegetDisableMusic,
  handlegetDisableUpload,
} from "../controllers/admin/disbale-features";

const adminRouter = Router();

adminRouter.route("/chat").post(handleDisableChat).get(handlegetDisableChat);
adminRouter
  .route("/upload")
  .post(handleDisbaleUpload)
  .get(handlegetDisableUpload);
adminRouter
  .route("/delete")
  .post(handleDisableDelete)
  .get(handlegetDisableDelete);
adminRouter.route("/music").post(handleDisableMusic).get(handlegetDisableMusic);
adminRouter
  .route("/bg")
  .post(handleDisbaleBackground)
  .get(handlegetDisableBackground);

export default adminRouter;
