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

  async viewQuiz({ quizId, creatorId, classId, omitAnswers }) {
    /**
     * get the quiz with Questions. if student, dont show the question correctAnswers
     */
    const quiz = await Quiz.findOne({
      _id: quizId,
      ...(creatorId && { createdBy: creatorId }),
      ...(classId && { class: classId }),
    });

    if (!quiz) {
      return null;
    }
    const questions = await Question.find(
      { quiz: quizId },
      { ...(omitAnswers && { correctAnswer: 0, correctAnswers: 0 }) }
    );

    return {
      id: quiz.id,
      classId: quiz.class,
      createdBy: quiz.createdBy,
      schedule: quiz.schedule,
      questions,
    };
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
  async updateQuizById(quizId, creatorId, updatedBody){
    const updatedQuiz = await Quiz.findOneAndUpdate({_id: quizId, createdBy: creatorId}, {$set: updatedBody}, {new: true})
    return updatedQuiz
  }
  async deleteQuiz({quizId, creatorId}){
    const deletedQuiz = await Quiz.findOneAndDelete({_id: quizId, createdBy: creatorId})
    if(deletedQuiz){
      const questions = await Question.deleteMany({quiz: quizId})
      return deletedQuiz
    }
    // return 'Quiz Deleted'
    return null
  }
}

export default new ExamService();
