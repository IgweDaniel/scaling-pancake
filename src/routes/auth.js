import { Router } from "express";
const route = Router();
import { ErrorHandler } from "@/helpers/error";
import { body, param, validationResult } from "express-validator";
import { AuthService, MailService } from "@/services/";

route.post(
  "/",
  body("loginId").isString(),
  body("password").isLength({ min: 5 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ErrorHandler(401, errors.array());
    }

    const { token, refreshToken, user } = await AuthService.login(req.body);
    res.header("auth-token", token);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "development" ? true : "none",
      secure: process.env.NODE_ENV === "development" ? false : true,
    });

    return res.status(200).json({ token, refreshToken, user });
  }
);

route.post(
  "/password-rest",
  body("email").isEmail(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ErrorHandler(401, errors.array());
    }

    const restLink = await AuthService.passwordResetLink(req.body.email);

    await MailService.forgotPasswordMail(restLink);

    return res.status(200).json({});
  }
);

route.post(
  "/password-rest/:tokenId",
  param("tokenId").isString(),
  body("password").isLength({ min: 5 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ErrorHandler(401, errors.array());
    }

    await AuthService.resetPassword({
      tokenId: req.params.tokenId,
      password: req.body.password,
    });

    return res.status(200).json({});
  }
);
export default route;
