import mongoose from "mongoose";

const { Schema } = mongoose;

const quizSchema = new Schema(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    class: {
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
const Quiz = mongoose.model("Quizes", quizSchema);

export { Quiz };
