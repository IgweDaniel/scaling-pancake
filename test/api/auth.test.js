const request = require("supertest");
import loaders from "@/loaders";
import config from "@/config";
import { User, Token, Class } from "@/db";
import { Roles } from "@/constants";
import hashPassword from "@/helpers/hashPassword";
import { MailService } from "@/services";
import { stripParam } from "@/helpers/stripParam";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const apiRoot = `${config.api.prefix}/auth`;
const { app } = loaders({});

const creds = {
  loginId: "d@ad.com",
  password: "mypassword",
};
let agent;
let testUser;
const spyMailService = jest.spyOn(MailService, "forgotPasswordMail");

// Test for existing user account creation proper handling
const fakeClassId = mongoose.Types.ObjectId();

beforeEach(async () => {
  agent = request.agent(app);

  testUser = await User.create({
    ...creds,
    email: "me@mail.com",
    role: Roles.ADMIN,
    class: fakeClassId,
    password: hashPassword(creds.password),
  });
});

afterEach(async () => {
  spyMailService.mockReset();
});

test("POST /auth 200 ", async () => {
  const { status, body, headers } = await agent.post(apiRoot).send(creds);

  expect(status).toBe(200);

  expect(body.user.id).toBe(testUser.id);

  expect(headers["auth-token"]).toBe(body.token);
  expect(headers["set-cookie"].join()).toMatch(new RegExp(body.refreshToken));
});

test("POST /auth 401 <bad input>", async () => {
  const { status, body, headers } = await agent
    .post(apiRoot)
    .send({ username: creds.username, password: "wrongpassword" });

  expect(status).toBe(401);
  expect(body.error).toHaveProperty("loginId");

  expect(headers["set-cookie"]).toBeFalsy();
  expect(headers["auth-token"]).toBeFalsy();
});

test("POST /auth 401 <Invalid credentials:password>", async () => {
  const { status, body, headers } = await agent
    .post(apiRoot)
    .send({ ...creds, password: "wrongpassword" });

  expect(status).toBe(401);
  expect(body.error).toBe("invalid user creds");

  expect(headers["set-cookie"]).toBeFalsy();
  expect(headers["auth-token"]).toBeFalsy();
});

test("POST /auth 401 <Invalid credentials:loginId>", async () => {
  const { status, body, headers } = await agent
    .post(apiRoot)
    .send({ ...creds, loginId: "invalid_loginId" });

  expect(status).toBe(401);
  expect(body.error).toBe("invalid user creds");

  expect(headers["set-cookie"]).toBeFalsy();
  expect(headers["auth-token"]).toBeFalsy();
});

test("GET /refresh 200 ", async () => {
  await agent.post(apiRoot).send(creds);
  const { status, headers, body } = await agent.get(`${apiRoot}/refresh`);

  expect(status).toBe(200);

  expect(headers["auth-token"]).toBe(body.token);

  expect(headers["set-cookie"].join()).toMatch(new RegExp(body.refreshToken));
});

test("GET /refresh 401 ", async () => {
  const { status, headers, body } = await agent.get(`${apiRoot}/refresh`);
  expect(status).toBe(401);

  expect(body.token).toBeFalsy();
  expect(headers["auth-token"]).toBeFalsy();
});

test("DELETE / 200 (Logout)", async () => {
  let res;
  await agent.post(apiRoot).send(creds);

  res = await agent.delete(apiRoot);
  expect(res.status).toBe(200);

  res = await agent.get(`${apiRoot}/refresh`);

  expect(res.status).toBe(401);
  expect(res.body.token).toBeFalsy();
  expect(res.headers["auth-token"]).toBeFalsy();
  expect(res.headers["set-cookie"]).toBeFalsy();
});

test("DELETE / 200 (Unauthenticated Logout)", async () => {
  let res;

  res = await agent.delete(apiRoot);
  expect(res.status).toBe(200);

  res = await agent.get(`${apiRoot}/refresh`);

  expect(res.status).toBe(401);
  expect(res.body.token).toBeFalsy();
  expect(res.headers["auth-token"]).toBeFalsy();
  expect(res.headers["set-cookie"]).toBeFalsy();
});

test("POST /password-rest 200", async () => {
  const { status } = await agent
    .post(`${apiRoot}/password-rest`)
    .send({ email: testUser.email });

  expect(spyMailService).toHaveBeenCalled();
  expect(status).toBe(200);
});

test("POST /password-rest 400 <Bad Input:Invalid Email>", async () => {
  const { status, body } = await agent
    .post(`${apiRoot}/password-rest`)
    .send({ email: "not a proper email" });

  expect(status).toBe(401);
  expect(body.error).toHaveProperty("email");
  expect(spyMailService).toHaveBeenCalledTimes(0);
});

test("POST /password-rest 400 <Nonexistent valid email>", async () => {
  const { status, body } = await agent
    .post(`${apiRoot}/password-rest`)
    .send({ email: "fakemail@mail.com" });

  expect(status).toBe(400);
  expect(spyMailService).toHaveBeenCalledTimes(0);

  expect(body.error).toBe("nonexistent mail");
});

test("POST /password-rest 200 ", async () => {
  const newPassword = "mynewpassword";

  await agent.post(`${apiRoot}/password-rest`).send({ email: testUser.email });
  expect(spyMailService).toHaveBeenCalled();
  const tokenId = stripParam(spyMailService.mock.lastCall[0]);

  const { status } = await agent
    .post(`${apiRoot}/password-rest/${tokenId}`)
    .send({ email: testUser.email, password: newPassword });
  expect(status).toBe(200);

  const user = await User.findById(testUser.id);
  expect(bcrypt.compareSync(newPassword, user.password)).toBeTruthy();
});

test("POST /password-rest 400 <malformed token> ", async () => {
  const newPassword = "mynewpassword";

  await agent.post(`${apiRoot}/password-rest`).send({ email: testUser.email });
  expect(spyMailService).toHaveBeenCalled();

  const tokenId = stripParam(spyMailService.mock.lastCall[0]);
  await Token.deleteOne({ tokenId });

  const { status } = await agent
    .post(`${apiRoot}/password-rest/${tokenId}`)
    .send({ email: testUser.email, password: newPassword });
  expect(status).toBe(400);

  const user = await User.findById(testUser.id);
  expect(bcrypt.compareSync(newPassword, user.password)).toBeFalsy();
});

test("POST /password-rest 400 <expired token> ", async () => {
  // Fake current time to ensure token has expired
  Date.now = jest.fn(() => 1663667001958);
  const newPassword = "mynewpassword";

  await agent.post(`${apiRoot}/password-rest`).send({ email: testUser.email });
  expect(spyMailService).toHaveBeenCalled();

  const tokenId = stripParam(spyMailService.mock.lastCall[0]);

  const { status } = await agent
    .post(`${apiRoot}/password-rest/${tokenId}`)
    .send({ email: testUser.email, password: newPassword });
  expect(status).toBe(400);

  const user = await User.findById(testUser.id);
  expect(bcrypt.compareSync(newPassword, user.password)).toBeFalsy();
});
