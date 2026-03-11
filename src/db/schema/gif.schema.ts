import { Schema, model, InferSchemaType } from "mongoose";

const GIFSchema = new Schema(
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

type GIFStype = InferSchemaType<typeof GIFSchema>;

export const GIFModel = model("gifs", GIFSchema);
export type { GIFStype };
