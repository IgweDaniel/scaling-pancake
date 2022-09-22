import { Router } from "express";
const route = Router();
import { ErrorHandler } from "@/helpers/error";
import { body, param, validationResult, query } from "express-validator";
import { AuthService, MailService, UserService } from "@/services/";
import { hasRoles, verifyToken } from "@/middleware";
import { Roles } from "@/constants";
import { validateClassId, validateUser } from "@/helpers/validators";

route.use(verifyToken);
route.get(
  "/",
  query("role").optional().isIn(Object.values(Roles)),
  hasRoles([Roles.INSTRUCTOR, Roles.ADMIN]),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ErrorHandler(401, errors.array());
    }

    const role = req.query.role;

    const filter = {
      ...(role && { role }),
      // Ignore authenticated user in users list
      _id: {
        $ne: req.user.id,
      },
    };

    if (req.user.role === Roles.INSTRUCTOR) {
      filter.role = Roles.STUDENT;
      filter.class = req.user.classId;
    }

    const users = await UserService.listUsers(filter);

    return res.status(200).json({ users });
  }
);

route.post(
  "/",
  hasRoles([Roles.ADMIN, Roles.INSTRUCTOR]),
  validateUser(),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new ErrorHandler(401, errors.array());
    }
    const deets = { ...req.body };
    if (req.user.role === Roles.INSTRUCTOR) {
      deets.role = Roles.STUDENT;
      deets.classId = req.user.classId;
    }

    const user = await UserService.createUser(deets);

    return res.status(200).json({ user });
  }
);

export default route;
