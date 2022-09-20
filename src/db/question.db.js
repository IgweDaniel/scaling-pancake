import mongoose from "mongoose";
import { QuestionTypes } from "@/constants";
const { Schema } = mongoose;

const discriminatorKey = "kind";

const questionSchema = new Schema(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: "Exams",
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    title: { type: String, required: true },
  },
  { timestamps: true, discriminatorKey },
  {
    toJSON: {
      virtuals: true,
    },
  }
);

const Question = mongoose.model("Questions", questionSchema);

const SingleChoiceQues = Question.discriminator(
  QuestionTypes.SINGLE_CHOICE,
  new mongoose.Schema(
    {
      options: {
        type: [String],
        required: true,
      },
      correctAnswer: {
        type: String,
        required: true,
      },
    },
    { discriminatorKey }
  )
);

const MultiChoiceQues = Question.discriminator(
  QuestionTypes.MULTI_CHOICE,
  new mongoose.Schema(
    {
      options: { type: [String], required: true },
      correctAnswers: {
        type: [String],
        required: true,
      },
    },
    { discriminatorKey }
  )
);
const FillTheGapQues = Question.discriminator(
  QuestionTypes.FILL_THE_GAP,
  new mongoose.Schema({}, { discriminatorKey })
);

const BooleanQues = Question.discriminator(
  QuestionTypes.BOOLEAN,
  new mongoose.Schema(
    {
      options: { type: [String], required: true, default: ["true", "false"] },
      correctAnswer: {
        type: Boolean,
        required: true,
      },
    },
    { discriminatorKey }
  )
);

export {
  Question,
  FillTheGapQues,
  MultiChoiceQues,
  SingleChoiceQues,
  BooleanQues,
};
