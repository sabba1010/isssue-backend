import { InferSchemaType, Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    race: {
      type: String,
    },
    gender: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    starSign: {
      type: String,
    },
    zodiac: {
      type: String,
    },
    planet: {
      type: String,
    },
    roles: {
      type: String,
      enum: ["admin", "user"],
      required: true,
    },
    recovery: {
      type: String,
    },
    profilePic: {
      type: String,
    },
    phone: {
      type: String,
    },
    countryCode: {
      type: String,
    },
    ip: {
      type: String,
    },
    isSpammer: {
      type: Boolean,
      default: false,
    },
    relationShip: {
      type: String,
    },
  },
  { timestamps: true }
);
type UserType = InferSchemaType<typeof UserSchema>;
export const UserModel = model("users", UserSchema);
export type { UserType };
