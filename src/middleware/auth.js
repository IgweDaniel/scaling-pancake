import jwt from "jsonwebtoken";
import { ErrorHandler } from "@/helpers/error";

export const verifyToken = (req, res, next) => {
  const token = req.header("auth-token");

  if (!token) {
    throw new ErrorHandler(401, "Token missing");
  }

  try {
    const verified = jwt.verify(token, process.env.SECRET);
    req.user = verified;

    next();
  } catch (error) {
    throw new ErrorHandler(401, error.message || "Invalid Token");
  }
};

export const hasRoles = (roles) => {
  return (req, res, next) => {
    const { role } = req.user;
    if (role && roles.includes(role)) {
      req.user = {
        ...req.user,
        role,
      };
      return next();
    } else {
      throw new ErrorHandler(401, "require admin role");
    }
  };
};
