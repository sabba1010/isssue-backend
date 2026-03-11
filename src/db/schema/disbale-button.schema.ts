import { InferSchemaType, Schema, model } from "mongoose";

const DisableButtonSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  disable: {
    type: Boolean,
    default: false,
  },
});

export type DisableButton = InferSchemaType<typeof DisableButtonSchema>;

export const DisableButtonModel = model("disable-button", DisableButtonSchema);
