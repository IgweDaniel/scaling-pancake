import { Roles } from "@/constants";
import { Class } from "@/db";
import { ErrorHandler } from "@/helpers/error";
import { body, checkSchema, validationResult } from "express-validator";

export const validateClassId = (cond = () => true) => {
  return body("classId")
    .if(cond)
    .custom((value) => {
      return Class.findById(value).then(($class) => {
        if (!$class) {
          return Promise.reject("Invalid classId");
        }
      });
    });
};

const isStudentCreation = (_, { req }) =>
  req.user.role === Roles.INSTRUCTOR || req.body.role === Roles.STUDENT;

export const validateUser = () => [
  body("loginId"),
  body("password").isLength({ min: 5 }),
  body("role")
    .if((_, { req }) => req.user.role === Roles.ADMIN)
    .notEmpty(),
  body("email").isEmail().withMessage("email is invalid").trim().escape(),

  validateClassId((_, { req }) => req.user.role === Roles.ADMIN)
    .exists()
    .withMessage("integers only!"),

  body("fullName").if(isStudentCreation).notEmpty(),
  body("DOB").if(isStudentCreation).notEmpty(),
  // .isDate(),
];

/* formatError: {
  password:"Invallid"
}*/

export const validateInputs = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedError = errors
      .array()
      .reduce((acc, err) => ({ ...acc, [err.param]: err.msg }), {});

    throw new ErrorHandler(401, formattedError);
  }
  next();
};
