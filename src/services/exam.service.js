import jwt from "jsonwebtoken";
import { ErrorHandler } from "@/helpers/error";
import { Question, Quiz, User } from "@/db";

import config from "@/config";
import { QuestionTypes } from "@/constants";
class ExamService {
  async createQuiz({ classId, schedule, creatorId }) {
    return Quiz.create({
      class: classId,
      schedule: new Date(schedule),
      createdBy: creatorId,
    });
  }
  // for student
  async listQuizes({ creatorId, classId }) {
    return Quiz.find({
      ...(creatorId && { createdBy: creatorId }),
      ...(classId && { class: classId }),
    });
  }

  async viewQuiz({ creatorId, classId }) {
    /**
     * get the quiz with Questions. if student dont show the question correctAnswers
     */
  }
  async createQuestion({ quizId, title, kind, options, answers, creatorId }) {
    return Question.create({
      quiz: quizId,
      kind,
      creator: creatorId,
      title,
      ...(kind !== QuestionTypes.FILL_THE_GAP && { options }),
      ...(kind !== QuestionTypes.MULTI_CHOICE
        ? { correctAnswer: answers[0] }
        : { correctAnswers: answers }),
    });
  }
}

export default new ExamService();
