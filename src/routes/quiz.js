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

export default route;
