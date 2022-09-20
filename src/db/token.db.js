import mongoose from "mongoose";
import { TokenTypes } from "@/constants";
const { Schema } = mongoose;

const tokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    tokenId: {
      type: String,
      required: true,
    },
    for: {
      type: String,
      required: true,
      enum: Object.values(TokenTypes),
    },
  },
  { timestamps: true },
  {
    toJSON: {
      virtuals: true,
    },
  }
);
const Token = mongoose.model("Tokens", tokenSchema);

export { Token };
