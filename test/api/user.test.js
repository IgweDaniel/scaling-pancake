import jwt from "jsonwebtoken";
import loaders from "@/loaders";
import config from "@/config";
import { User, Token, Class, Instructor, Student } from "@/db";
const request = require("supertest");
import { Roles } from "@/constants";
import { createAccountTokens, setupAccounts, stringify } from "test/testUtils";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import hashPassword from "@/helpers/hashPassword";

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

test("Update /users/ 200 admin updating student ", async () => {
  const updateInput = {
    email: "updatedEmail@mail.com",
    fullName: "updatedFullName",
    DOB: new Date(),
  };
  const { status, body } = await agent
    .post(`${apiRoot}/updateUser/:${accounts.student.id}`)
    .send(updateInput)
    .set("auth-token", tokens.admin);

  expect(status).toBe(404);
});

test("PATCH /users/ 200 updating currently logged user <instance: student updating all fields> ", async () => {
  const updateInput = {
    DOB: new Date(),
    fullName: "updatedFullNameeeeeeeeeeeeeee",
    password: "updatedPassword",
  };
  // student updating self
  let userId = accounts.student.id;
  const { body, status } = await agent
    .patch(`${apiRoot}/update`)
    .send(updateInput)
    .set("auth-token", tokens.student);
  expect(updateInput.fullName).toBe(body.fullName);
  expect(bcrypt.compare(updateInput.password, body.password)).toBeTruthy();
  expect(body.email).toBe(accounts.student.email);
  expect(status).toBe(200);
});

test("PATCH /users/ 200 updating currently logged user <instance: instructor updating a single field> ", async () => {
  const updateInput = {
    password: "updatedPassword",
  };
  // student updating self
  let userId = accounts.instructor.id;
  const { body, status } = await agent
    .patch(`${apiRoot}/update`)
    .send(updateInput)
    .set("auth-token", tokens.instructor);
  expect(body.email).toBe(accounts.instructor.email);
  expect(bcrypt.compare(updateInput.password, body.password)).toBeTruthy();
  expect(status).toBe(200);
});

test("PATCH /users 200 updating a user by id <Admin super access to update any user>", async () => {
  const updateInput = {
    fullName: "updatedFullnameeee",
    password: "updatedPassword",
  };
  const userId = accounts.student.id;
  const { body, status } = await agent
    .patch(`${apiRoot}/update/${userId}`)
    .send(updateInput)
    .set("auth-token", tokens.admin);
});

test("PATCH /users 200 updating a user by id <Instructor updating a user of their class>", async () => {
  const updateInput = {
    fullName: "updatedFullnameeee",
    password: "updatedPassword",
  };

  const userId = accounts.student.id;
  const { body, status } = await agent
    .patch(`${apiRoot}/update/${userId}`)
    .send(updateInput)
    .set("auth-token", tokens.instructor);
});

describe("PATCH /users for other users", () => {
  const classId = mongoose.Types.ObjectId();
  let newIns;
  let newTokens;
  let newAccounts;

  beforeAll(async () => {
    const password = hashPassword("instructorpassword");
    newIns = await User.create({
      loginId: "newInstru@man.com",
      email: "newInstructor@mail.com",
      class: classId,
      password,
      kind: Roles.INSTRUCTOR,
    });

    newAccounts = { ...accounts, instructor2: newIns };
    newTokens = createAccountTokens(newAccounts);
  });

  test("PATCH /users 403 updating a user by id <Instructor updating a user not in their class>", async () => {
    const updateInput = {
      fullName: "updatedFullnameeee",
      password: "updatedPassword",
    };

    const userId = accounts.student.id;
    const { body, status } = await agent
      .patch(`${apiRoot}/update/${userId}`)
      .send(updateInput)
      .set("auth-token", newTokens.instructor2);
      expect(status).toBe(403)
      expect(body.error).toBe("Permission Denied")
  });
});
