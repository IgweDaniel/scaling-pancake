import { Router } from "express";
import auth from "./auth";
import users from "./users";
import quiz from "./quiz";
import question from "./question";

export default () => {
  const router = Router();
  router.use("/auth", auth);
  router.use("/users", users);
  router.use("/quiz", quiz);
  router.use("/questions", question);

  return router;
};
