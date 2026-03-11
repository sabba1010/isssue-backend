import "dotenv/config";
import mongoose from "mongoose";
import { UserModel } from "../db/schema/user.schema";

const promoteUser = async (email: string) => {
  try {
    await mongoose.connect(process.env.DB as string);
    console.log("Connected to DB");

    const result = await UserModel.findOneAndUpdate(
      { email: email },
      { roles: "admin" },
      { new: true }
    );

    if (result) {
      console.log(`Success: User ${email} is now an admin.`);
    } else {
      console.log(`Error: User with email ${email} not found.`);
    }
  } catch (err) {
    console.error("Database connection error:", err);
  } finally {
    await mongoose.disconnect();
  }
};

const email = process.argv[2];
if (!email) {
  console.log("Usage: npx ts-node make-admin.ts <user-email>");
  process.exit(1);
}

promoteUser(email);
