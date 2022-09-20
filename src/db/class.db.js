import mongoose from "mongoose";

const { Schema } = mongoose;

const classSchema = new Schema(
  {
    name: {
      type: String,
    },
    code: {
      type: Number,
      required: true,
      unique: true,
    },
  },
  { timestamps: true },
  {
    toJSON: {
      virtuals: true,
    },
  }
);
const Class = mongoose.model("Classes", classSchema);

export { Class };
