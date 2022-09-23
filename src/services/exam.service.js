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
  async createQuestion() {}
}

export default new ExamService();
