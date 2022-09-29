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
import { QuestionTypes, Roles } from "@/constants";
import { validateClassId, validateInputs } from "@/middleware/validators";

/**
 * @body quizId,title, kind options
 */
route.use(verifyToken);
route.post(
  "/",
  hasRoles([Roles.ADMIN, Roles.INSTRUCTOR]),
  body("quizId").isMongoId(),
  body("title").isString(),
  body("kind").isIn(Object.values(QuestionTypes)),
  body("options")
    .if(body("kind").not().equals(QuestionTypes.FILL_THE_GAP))
    .exists(),
  check("options.*").isString(),
  check("answers.*").isString(),
  validateInputs,
  async (req, res) => {
    const question = await ExamService.createQuestion({
      ...req.body,
      creatorId: req.user.id,
    });
    return res.status(200).json({ question });
  }
);

export default route;
