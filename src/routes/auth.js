import { Router } from "express";
const route = Router();
import { ErrorHandler } from "@/helpers/error";
import { body, param, validationResult } from "express-validator";
import { AuthService, MailService } from "@/services/";

const cookieConfig = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : true,
  secure: process.env.NODE_ENV === "production" ? true : false,
};

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
    res.cookie("refreshToken", refreshToken, cookieConfig);

    return res.status(200).json({ token, refreshToken, user });
  }
);

route.delete("/", async (req, res) => {
  if (req.cookies.refreshToken) {
    res.clearCookie("refreshToken");
  }
  return res.status(200).json({});
});

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

route.get("/refresh", async (req, res) => {
  if (!req.cookies.refreshToken) {
    throw new ErrorHandler(401, "Token missing");
  }

  const { token, refreshToken } = await AuthService.generateRefreshToken(
    req.cookies.refreshToken
  );
  res.header("auth-token", token);
  res.cookie("refreshToken", refreshToken, cookieConfig);

  return res.status(200).json({ token, refreshToken });
});

export default route;
