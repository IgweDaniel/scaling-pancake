import { Roles } from "@/constants";
import { Class } from "@/db";
import { ErrorHandler } from "@/helpers/error";
import { body, checkSchema, validationResult } from "express-validator";

export const validateClassId = () => {
  return body("classId").custom((value) => {
    return Class.findById(value).then(($class) => {
      if ($class) {
        return Promise.reject("Invalid classId");
      }
    });
  });
};

export const validateUser = () => [
  body("loginId"),
  body("password").isLength({ min: 5 }),
  body("role")
    .if((_, { req }) => req.user.role === Roles.ADMIN)
    .notEmpty(),
  body("email").isEmail().withMessage("email is invalid").trim().escape(),

  body("classId")
    .if((_, { req }) => req.user.role === Roles.ADMIN)
    .exists()
    .withMessage("integers only!"),
  // .custom((value) => {
  //   return Class.findById(value).then(($class) => {
  //     if (!$class) {
  //       return Promise.reject("Invalid classId");
  //     }
  //   });
  // }),

  body("fullName")
    .if(
      (_, { req }) =>
        req.user.role === Roles.INSTRUCTOR || req.body.role === Roles.STUDENT
    )
    .notEmpty(),

  body("DOB")
    .if(
      (_, { req }) =>
        req.user.role === Roles.INSTRUCTOR || req.body.role === Roles.STUDENT
    )
    .notEmpty(),
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
