/* eslint-disable no-console */
import { connect } from "mongoose";

const DATABASE_URL = process.env.DB!;
export function dbConnect() {
  connect(DATABASE_URL)
    .then(() => {
      console.log("Database connected");
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
