import { Router } from "express";
import multer from "multer";
import { UPLOAD_DIR } from "../utils/constant";
import { multerStorage } from "../utils/utils";
import { initUpload, uploadChunk, completeUpload } from "../controllers/users/upload.controller";

const uploadRouter = Router();
const storage = multerStorage(UPLOAD_DIR);
const upload = multer({ storage });

uploadRouter.post("/init", initUpload);
uploadRouter.post("/chunk", upload.single("chunk"), uploadChunk);
uploadRouter.post("/complete", completeUpload);

export default uploadRouter;
