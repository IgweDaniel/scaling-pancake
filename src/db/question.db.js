import mongoose from "mongoose";
import { QuestionTypes } from "@/constants";
const { Schema } = mongoose;

const discriminatorKey = "kind";

const questionSchema = new Schema(
  {
    quiz: {
      type: Schema.Types.ObjectId,
      ref: "Quizes",
      required: true,
    },
    //  class: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Classes",
    //   required: true,
    // },
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
  new mongoose.Schema(
    {
      correctAnswer: {
        type: String,
        required: true,
      },
    },
    { discriminatorKey }
  )
);

const BooleanQues = Question.discriminator(
  QuestionTypes.BOOLEAN,
  new mongoose.Schema(
    {
      options: { type: [String], required: true, default: ["true", "false"] },
      correctAnswer: {
        type: String,
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
