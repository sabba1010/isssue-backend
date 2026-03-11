import { Router } from "express";
import {
  DeleteProfile,
  GetAllRegsiteredUsers,
  GetCurrentUserProfile,
  getDefaulProfilePicture,
  GetSpecifcUserProfile,
  handleAddRemoveFriend,
  handleAdminDeleteUser,
  handleGetAllFriends,
  handleGetToken,
  handleGetUserFriends,
  Login,
  Register,
  ResetPassword,
  SendRecoveryMail,
  UpdateProfile,
  UpdateProfilePicture,
} from "../controllers/users/users.controller";
import multer from "multer";
import { multerStorage } from "../utils/utils";
import { UPLOAD_DIR } from "../utils/constant";

const userRouter = Router();
const storage = multerStorage(UPLOAD_DIR);
const upload = multer({ storage });

userRouter.route("/").post(Register).put(Login).get(GetAllRegsiteredUsers);
userRouter.route("/recover").post(SendRecoveryMail).put(ResetPassword);
userRouter.route("/delete-profile").delete(DeleteProfile);
userRouter.route("/update-profile").put(UpdateProfile);
userRouter
  .route("/update-profile-pic")
  .put(upload.single("files"), UpdateProfilePicture);
userRouter.route("/default-profile").get(getDefaulProfilePicture);
userRouter.route("/private-profile").get(GetCurrentUserProfile);
userRouter.route("/friend").get(handleGetAllFriends);
userRouter.route("/profile-friend").get(handleGetUserFriends);
userRouter.route("/token").get(handleGetToken);
userRouter.route("/friend/:id").post(handleAddRemoveFriend);
userRouter.route("/:id").delete(handleAdminDeleteUser);
userRouter.route("/public-profile/:id").get(GetSpecifcUserProfile);

export default userRouter;
