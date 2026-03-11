import { Schema, model, InferSchemaType } from "mongoose";

const ImageSchema = new Schema(
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

type ImageType = InferSchemaType<typeof ImageSchema>;

export const ImageModel = model("images", ImageSchema);
export type { ImageType };
