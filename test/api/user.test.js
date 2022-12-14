import jwt from "jsonwebtoken";
import loaders from "@/loaders";
import config from "@/config";
import { User, Token, Class, Instructor, Student } from "@/db";
const request = require("supertest");
import { Roles } from "@/constants";
import { createAccountTokens, setupAccounts, stringify } from "test/testUtils";
import mongoose from "mongoose";

const { app } = loaders({});

let agent;
const apiRoot = `${config.api.prefix}/users`;

let tokens, accounts, testClass;

beforeEach(async () => {
  agent = request.agent(app);
  [accounts, testClass] = await setupAccounts();
  tokens = createAccountTokens(accounts);
});

test("GET /users 401 (students acess)", async () => {
  const { status } = await agent
    .get(`${apiRoot}`)
    .set("auth-token", tokens.student);

  expect(status).toBe(401);
});

test("GET /users 200 (instructor acess)", async () => {
  const { status, body } = await agent
    .get(`${apiRoot}`)
    .set("auth-token", tokens.instructor);

  expect(status).toBe(200);
  expect(body.users).toHaveLength(1);

  expect(body.users[0].loginId).toBe(accounts.student.loginId);
});

test("GET /users 200 (admin acess)", async () => {
  const { status, body } = await agent
    .get(`${apiRoot}`)
    .set("auth-token", tokens.admin);

  expect(status).toBe(200);
  expect(body.users).toHaveLength(2);
});

test("GET /users 200 (admin acess) with role filter", async () => {
  let res = await agent
    .get(`${apiRoot}`)
    .query({ role: Roles.INSTRUCTOR })
    .set("auth-token", tokens.admin);

  expect(res.status).toBe(200);
  expect(res.body.users).toHaveLength(1);
  expect(res.body.users[0].loginId).toBe(accounts.instructor.loginId);

  res = await agent
    .get(`${apiRoot}`)
    .query({ role: Roles.STUDENT })
    .set("auth-token", tokens.admin);

  expect(res.status).toBe(200);
  expect(res.body.users).toHaveLength(1);
  expect(res.body.users[0].loginId).toBe(accounts.student.loginId);
});

test("GET /users 200 (admin acess) with role filter <Bad Input>", async () => {
  const { status } = await agent
    .get(`${apiRoot}`)
    .query({ role: "bad_role_type" })
    .set("auth-token", tokens.admin);

  expect(status).toBe(401);
});

test("POST /users/ 200 INSTRUCTOR creation as admin  ", async () => {
  const input = {
    email: "testEmail@mail.com",
    loginId: "testEmail@mail.com",
    password: "password",
    classId: testClass.id,
    role: Roles.INSTRUCTOR,
  };

  const { status, body } = await agent
    .post(`${apiRoot}/`)
    .send(input)
    .set("auth-token", tokens.admin);

  expect(status).toBe(200);
  expect(body.user.role).toBe(Roles.INSTRUCTOR);
  expect(body.user.loginId).toBe(input.loginId);
});

test("POST /users/ 401 student creation no DOB, fullName and invalid classId as admin <Bad input>", async () => {
  const { status, body } = await agent
    .post(`${apiRoot}/`)
    .send({
      email: "testEmail@mail.com",
      loginId: "testloginl@mail.com",
      password: "password",
      classId: new mongoose.Types.ObjectId(),
      role: Roles.STUDENT,
    })
    .set("auth-token", tokens.admin);

  expect(status).toBe(401);
  expect(body.error).toHaveProperty("fullName");
  expect(body.error).toHaveProperty("classId");
  expect(body.error).toHaveProperty("DOB");
});

test("POST /users/ 200 student creation admin ", async () => {
  const input = {
    email: "testEmail@mail.com",
    password: "password",
    classId: testClass.id,
    fullName: "emiladekuti",
    DOB: new Date(),
    role: Roles.STUDENT,
    loginId: "loginIdsmmm",
  };
  const { status, body } = await agent
    .post(`${apiRoot}/`)
    .send(input)
    .set("auth-token", tokens.admin);

  expect(status).toBe(200);
  expect(body.user.role).toBe(Roles.STUDENT);
  expect(body.user.loginId).toBe(input.loginId);
  expect(body.user.DOB).toBe(input.DOB.toISOString());
});

test("POST /users/ 200 instructor creating student ", async () => {
  const input = {
    email: "techercreatingstudent@mail.com",
    password: "password",
    DOB: new Date(),
    fullName: "Hi",
    loginId: "loginId1111",
  };
  const { status, body } = await agent
    .post(`${apiRoot}/`)
    .send(input)
    .set("auth-token", tokens.instructor);

  expect(status).toBe(200);
  expect(body.user.role).toBe(Roles.STUDENT);
  expect(body.user.loginId).toBe(input.loginId);

  const { classId: instructorClassId } = jwt.verify(
    tokens.instructor,
    process.env.SECRET
  );
  expect(body.user.class).toBe(instructorClassId);
});
