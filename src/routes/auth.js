import { Router } from "express";
const route = Router();
import { ErrorHandler } from "@/helpers/error";
import { body, param } from "express-validator";
import { AuthService, MailService } from "@/services/";
import { validateInputs } from "@/middleware/validators";

const cookieConfig = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : true,
  secure: process.env.NODE_ENV === "production" ? true : false,
};

route.post(
  "/",
  body("loginId").isString(),
  body("password").isLength({ min: 5 }),
  validateInputs,
  async (req, res) => {
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
  validateInputs,
  async (req, res) => {
    const email = req.body.email;
    const resetLink = await AuthService.passwordResetLink(email);

    await MailService.forgotPasswordMail(resetLink, email);

    return res.status(200).json({});
  }
);

route.post(
  "/password-rest/:tokenId",
  param("tokenId").isString(),
  body("password").isLength({ min: 5 }),
  validateInputs,
  async (req, res) => {
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

  const { token, refreshToken } = AuthService.generateRefreshToken(
    req.cookies.refreshToken
  );
  res.header("auth-token", token);
  res.cookie("refreshToken", refreshToken, cookieConfig);

  return res.status(200).json({ token, refreshToken });
});


export default route;
