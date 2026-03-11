import { Schema, model, InferSchemaType } from "mongoose";

const VideoSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    setAsBackground: {
      type: Boolean,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    style: {
      type: String,
      default: null,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

type VideoType = InferSchemaType<typeof VideoSchema>;

export const VideoModel = model("videos", VideoSchema);
export type { VideoType };
