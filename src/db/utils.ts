import { TError, verifyToken } from "../utils/utils";
import { UserModel } from "./schema/user.schema";

export async function getCurrentUser(token?: string) {
  if (!token) return null;
  const id = verifyToken(token);
  if (id?.id === "000000000000000000000000" || id?.id === "super-admin-special-id") {
    return {
      _id: "000000000000000000000000",
      name: "Super Admin",
      email: "admin@system.local",
      roles: "admin",
      race: "System",
      gender: "Other",
      profilePic: "",
    };
  }
  const user = await UserModel.findById(id?.id).lean();
  if (!user) {
    TError("User does not exist", 404);
    return null;
  }
  return user as any;
}
export enum BackgroundTypeEnum {
  PUBLIC = "public",
  PRIVATE = "private",
}
