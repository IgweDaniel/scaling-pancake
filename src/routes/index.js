import { Router } from "express";
import auth from "./auth";

export default () => {
  const router = Router();
  router.use("/auth", auth);

  return router;
};
