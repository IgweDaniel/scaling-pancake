import express from "express";
import _ from "express-async-errors";
import cors from "cors";
const cookieParser = require("cookie-parser");
import routes from "@/routes";
import config from "@/config";
import { handleError } from "@/helpers/error";

export default (ctx) => {
  const app = express();
  app.use(cookieParser());
  app.use(cors());

  //   app.use(ctx.sessionParser);
  app.use(express.json());
  // Load API routes
  app.use(config.api.prefix, routes());
  app.use(handleError);
  return app;
};
