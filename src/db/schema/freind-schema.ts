import { Schema, model, InferSchemaType } from "mongoose";

const FriendSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  friend: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
});

export const FriendModel = model("friends", FriendSchema);
export type FriendType = InferSchemaType<typeof FriendSchema>;
