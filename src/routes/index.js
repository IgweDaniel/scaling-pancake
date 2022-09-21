import { Router } from "express";
import auth from "./auth";
import users from "./users";

export default () => {
  const router = Router();
  router.use("/auth", auth);
  router.use("/users", users);

  return router;
};
