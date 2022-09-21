import { Router } from "express";
const route = Router();
import { ErrorHandler } from "@/helpers/error";
import { body, param, validationResult, query } from "express-validator";
import { AuthService, MailService, UserService } from "@/services/";
import { isAdmin, verifyToken } from "@/middleware";
import { Roles } from "@/constants";

route.use(verifyToken);
route.get(
  "/",
  query("role").optional().isIn(Object.values(Roles)),
  isAdmin,
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
      filter.classId = req.user.classId;
    }

    const users = await UserService.listUsers(filter);

    return res.status(200).json({ users });
  }
);

export default route;
