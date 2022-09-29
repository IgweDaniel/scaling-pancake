import jwt from "jsonwebtoken";
import { ErrorHandler } from "@/helpers/error";
import { Quiz, User } from "@/db";

import config from "@/config";
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
  async createQuestion() {}
}

export default new ExamService();
