import mongoose from "mongoose";
import { Roles } from "@/constants";
const { Schema } = mongoose;
const discriminatorKey = "kind";

const userSchema = new Schema(
  {
    loginId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      default: Roles.ADMIN,
    },
    email: {
      type: String,
      match: /^\S+@\S+\.\S+$/,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      type: String,
      default: "",
    },
  },
  { timestamps: true, discriminatorKey },
  {
    toJSON: {
      virtuals: true,
    },
  }
);
const User = mongoose.model("Users", userSchema);

const Student = User.discriminator(
  "Student",
  new mongoose.Schema(
    {
      role: {
        type: String,
        required: true,
        default: Roles.STUDENT,
        enum: Roles.STUDENT,
      },
      DOB: { type: Date, required: true },
      fullName: { type: String, required: true },
    },
    { discriminatorKey }
  )
);

const Instructor = User.discriminator(
  "Instructor",
  new mongoose.Schema(
    {
      role: {
        type: String,
        required: true,
        default: Roles.INSTRUCTOR,
      },
    },
    { discriminatorKey }
  )
);

export { User, Student, Instructor };
