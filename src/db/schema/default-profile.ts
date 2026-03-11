import { Schema, model, InferSchemaType } from "mongoose";

const DefaultProfileSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});

export type DefaultProfileType = InferSchemaType<typeof DefaultProfileSchema>;

export const DefaultProfileModel = model(
  "default-profiles",
  DefaultProfileSchema
);
