import { AnswerTypes } from "@/constants";
import mongoose from "mongoose";

const { Schema } = mongoose;
const discriminatorKey = "kind";
const answerSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Questions",
      required: true,
    },
  },
  { timestamps: true, discriminatorKey },
  {
    toJSON: {
      virtuals: true,
    },
  }
);
const Answer = mongoose.model("Answers", answerSchema);

const SingleChoiceAns = Answer.discriminator(
  AnswerTypes.SINGLE_ANSWER,
  new mongoose.Schema(
    {
      value: String,
    },
    { discriminatorKey }
  )
);

const MultiChoiceAns = Answer.discriminator(
  AnswerTypes.MULTI_ANSWER,
  new mongoose.Schema(
    {
      value: [String],
    },
    { discriminatorKey }
  )
);

export { Answer, SingleChoiceAns, MultiChoiceAns };
