import { Router } from "express";
const route = Router();
import { ErrorHandler } from "@/helpers/error";
import { body, param, query } from "express-validator";
import { AuthService, MailService, UserService } from "@/services/";
import { hasRoles, verifyToken } from "@/middleware/auth";
import { Roles } from "@/constants";
import { validateInputs, validateUser } from "@/middleware/validators";

route.use(verifyToken);
route.get(
  "/",
  hasRoles([Roles.INSTRUCTOR, Roles.ADMIN]),
  query("role").optional().isIn(Object.values(Roles)),
  validateInputs,
  async (req, res) => {
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
  validateInputs,
  async (req, res) => {
    const deets = { ...req.body };
    if (req.user.role === Roles.INSTRUCTOR) {
      deets.role = Roles.STUDENT;
      deets.classId = req.user.classId;
    }

    const user = await UserService.createUser(deets);
    return res.status(200).json({ user });
  }
);

route.patch(
  "/update",
  body("password").optional().isString().isLength({min: 5}),
  body("fullName").optional().isString(),
  body("DOB").optional().isString(),
  validateInputs,
  async (req, res) => {
    const id = req.user.id;
    const kind = req.user.role
    const updatedUser = await UserService.updateUser(id, req.body, kind);
    return res.status(200).json(updatedUser);
  }
);

route.patch("/update/:id", 
body("fullname").optional().isString(),
body("password").optional().isString().isLength({min: 5}),
body("DOB").optional().isString(),
validateInputs,
async(req, res)=>{
  const id = req.params.id
  const updatedUser = await UserService.updateUserById(id, req.user, req.body)
  return res.status(200).json(updatedUser)
})

export default route;
