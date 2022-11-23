import { Router } from "express";
const route = Router();
import { ErrorHandler } from "@/helpers/error";
import { body, check, param, query } from "express-validator";
import {
  AuthService,
  MailService,
  UserService,
  ExamService,
} from "@/services/";
import { hasRoles, verifyToken } from "@/middleware/auth";
import { Roles } from "@/constants";
import { validateClassId, validateInputs } from "@/middleware/validators";

route.use(verifyToken);
route.post(
  "/",
  hasRoles([Roles.ADMIN, Roles.INSTRUCTOR]),
  validateClassId(),
  check("schedule").isDate(),
  validateInputs,
  async (req, res) => {
    const quiz = await ExamService.createQuiz({
      ...req.body,
      creatorId: req.user.id,
    });
    return res.status(200).json({ quiz });
  }
);

route.get("/", hasRoles(Roles.ALL), async (req, res) => {
  const filter = {};

  if (req.user.role === Roles.STUDENT) {
    filter.classId = req.user.classId;
  } else if (req.user.role === Roles.INSTRUCTOR) {
    filter.creatorId = req.user.id;
  }
  const quizes = await ExamService.listQuizes(filter);
  return res.status(200).json({ quizes });
});

route.get(
  "/:quizId",
  param("quizId").isMongoId(),
  hasRoles(Roles.ALL),
  async (req, res) => {
    const filter = {
      quizId: req.params.quizId,
      omitAnswers: false,
    };

    if (req.user.role === Roles.STUDENT) {
      filter.classId = req.user.classId;
      filter.omitAnswers = true;
    } else if (req.user.role === Roles.INSTRUCTOR) {
      filter.creatorId = req.user.id;
    }

    const quiz = await ExamService.viewQuiz(filter);
    if (!quiz) {
      return res.status(404).json({ quiz });
    }

    return res.status(200).json({ quiz });
  }
);


route.put(
  "/:quizId",
  param("quizId").isMongoId(),
  hasRoles([Roles.ADMIN, Roles.INSTRUCTOR]),
  async(req, res)=>{
    const {class: classId, ...others} = req.body
    const quizId = req.params.quizId
    const creatorId = req.user.id
    let updatedBody = {}
    if(req.user.role==Roles.INSTRUCTOR){
      updatedBody = {...others}
    }else{
      updatedBody = {...req.body}
    }
    const updatedQuiz = await ExamService.updateQuizById(quizId, creatorId, updatedBody)
    if(!updatedQuiz){
      return res.status(401).json('You are not permitted')
    }
    return res.status(200).json(updatedQuiz)
  }
  )
route.delete(
  "/:quizId",
  param("quizId").isMongoId(),
  hasRoles([Roles.ADMIN, Roles.INSTRUCTOR]),
  async(req, res)=>{
    const filter = {
      quizId: req.params.quizId,
      creatorId: req.user.id
    }
    const deletedQuiz = await ExamService.deleteQuiz(filter)
    if(deletedQuiz){
      return res.status(200).json('Quiz deleted')
    }else{
      return res.status(401).json('You are not allowed')
    }
  }
  )

export default route;
