import jwt from "jsonwebtoken";
import loaders from "@/loaders";
import config from "@/config";
import { User, Token, Class, Instructor, Student } from "@/db";
const request = require("supertest");
import { Roles } from "@/constants";
import { createAccountTokens, setupAccounts, stringify } from "test/testUtils";
import mongoose from "mongoose";

const apiRoot = `${config.api.prefix}/quiz`;
const { app } = loaders({});

let agent;

let tokens, accounts, testClass;

beforeEach(async () => {
  agent = request.agent(app);
  testClass = await Class.create({
    name: "JSS1",
    code: 401,
  });
  accounts = await setupAccounts();
  tokens = createAccountTokens(accounts);
});

test("GET /quiz 200 (students acess)", async () => {
  const { status } = await agent
    .post(`${apiRoot}`)
    .set("auth-token", tokens.student);
  expect(status).toBe(401);
});

test("GET /quiz 401 (badInput acess)", async () => {
  const { status, body } = await agent
    .post(`${apiRoot}`)
    .set("auth-token", tokens.admin)
    .send({
      classId: new mongoose.Types.ObjectId(),
    });

  expect(status).toBe(401);
  expect(body.quiz).toBeFalsy();
  expect(body.error).toHaveProperty("classId");
  expect(body.error).toHaveProperty("schedule");
});

test("GET /quiz 200 (instructor acess)", async () => {
  const { status, body } = await agent
    .post(`${apiRoot}`)
    .set("auth-token", tokens.instructor)
    .send({
      classId: testClass.id,
      schedule: "2002-07-15",
    });

  expect(status).toBe(200);
  expect(body.quiz).toBeTruthy();
  expect(body.quiz.createdBy).toBe(accounts.instructor.id);
});

test("GET /quiz 200 (admin acess)", async () => {
  const { status, body } = await agent
    .post(`${apiRoot}`)
    .set("auth-token", tokens.admin)
    .send({
      classId: testClass.id,
      schedule: "2002-07-15",
    });

  expect(status).toBe(200);
  expect(body.quiz).toBeTruthy();
  expect(body.quiz.createdBy).toBe(accounts.admin.id);
});
