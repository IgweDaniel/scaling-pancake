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

export default route;
