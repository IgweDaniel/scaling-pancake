import dotenv from "dotenv";

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process

  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
  port: parseInt(process.env.PORT, 10),
  databaseURL: process.env.DBURL,
  websiteUrl: process.env.WEBSITE_URL,
  secret: process.env.SECRET,
  refreshSecret: process.env.REFRESH_SECRET,
  api: {
    prefix: "/api",
    verifyTokenDuration: 10 * 60,
  },
};
