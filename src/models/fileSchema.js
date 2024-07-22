import mongoose from "mongoose";

export const fileSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);
