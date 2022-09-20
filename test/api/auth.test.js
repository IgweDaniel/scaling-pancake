const request = require("supertest");
import loaders from "@/loaders";
import config from "@/config";
import { User, Student, Instructor, Token } from "@/db";
import { Roles } from "@/constants";
import hashPassword from "@/helpers/hashPassword";
import { MailService } from "@/services";
import { stripParam } from "@/helpers/stripParam";
import bcrypt from "bcryptjs";

const apiRoot = `${config.api.prefix}/auth`;
const { app } = loaders({});
const agent = request.agent(app);

const creds = {
  loginId: "d@ad.com",
  password: "mypassword",
};
let testUser;
const spyMailService = jest.spyOn(MailService, "forgotPasswordMail");

beforeEach(async () => {
  testUser = await User.create({
    ...creds,
    email: "me@mail.com",
    role: Roles.ADMIN,
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
  expect(headers["set-cookie"]).toContain(
    `refreshToken=${body.refreshToken}; Path=/; HttpOnly; Secure; SameSite=None`
  );
});

test("POST /auth 401 <bad input>", async () => {
  const { status, body, headers } = await agent
    .post(apiRoot)
    .send({ username: creds.username, password: "wrongpassword" });

  expect(status).toBe(401);

  expect(headers["set-cookie"]).toBeFalsy();
  expect(headers["auth-token"]).toBeFalsy();

  expect(body.status).toBe("error");
  expect(body.message).toContainEqual({
    msg: "Invalid value",
    param: "loginId",
    location: "body",
  });
});

test("POST /auth 401 <invalid credentials>", async () => {
  const { status, body, headers } = await agent
    .post(apiRoot)
    .send({ ...creds, password: "wrongpassword" });

  expect(status).toBe(401);

  expect(headers["set-cookie"]).toBeFalsy();
  expect(headers["auth-token"]).toBeFalsy();

  expect(body.status).toBe("error");
  expect(body.message).toBe("invalid user creds");
});

test("POST /password-rest 200", async () => {
  const { status } = await agent
    .post(`${apiRoot}/password-rest`)
    .send({ email: testUser.email });

  expect(spyMailService).toHaveBeenCalled();
  expect(status).toBe(200);
});

test("POST /password-rest 400 <Bad Input>", async () => {
  const { status, body } = await agent
    .post(`${apiRoot}/password-rest`)
    .send({ email: "not a proper email" });

  expect(status).toBe(401);
  expect(spyMailService).toHaveBeenCalledTimes(0);
  expect(body.status).toBe("error");
  expect(body.message).toContainEqual({
    location: "body",
    msg: "Invalid value",
    param: "email",
    value: "not a proper email",
  });
});

test("POST /password-rest 400 <Invalid email>", async () => {
  const { status, body } = await agent
    .post(`${apiRoot}/password-rest`)
    .send({ email: "fakemail@mail.com" });

  expect(status).toBe(400);
  expect(spyMailService).toHaveBeenCalledTimes(0);
  expect(body.status).toBe("error");
  expect(body.message).toBe("nonexistent mail");
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
