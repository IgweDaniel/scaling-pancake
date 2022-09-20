import mongoose from "mongoose";

const { Schema } = mongoose;

const examSchema = new Schema(
  {
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Classes",
      required: true,
    },
    // class taking the exam
    schedule: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
  {
    toJSON: {
      virtuals: true,
    },
  }
);
const Exam = mongoose.model("Exams", examSchema);

export { Exam };
