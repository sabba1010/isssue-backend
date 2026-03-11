import { Schema, model, InferSchemaType } from "mongoose";

const ChatSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    message: {
      type: String,
    },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    sentTo: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    files: {
      type: [String],
      default: [],
    },
    token: {
      type: String,
      default: null,
    },
    spammer: {
      type: Boolean,
      default: false,
    },
    ip: {
      type: String,
    },
    ips: {
      type: [String],
      default: [],
    },
    origin: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    roomId: {
      type: String,
    },
  },
  { timestamps: true }
);

type ChatType = InferSchemaType<typeof ChatSchema>;
export const ChatModel = model("chats", ChatSchema);
export { ChatType };
