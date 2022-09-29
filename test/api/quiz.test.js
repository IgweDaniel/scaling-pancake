import jwt from "jsonwebtoken";
import loaders from "@/loaders";
import config from "@/config";
import { User, Token, Class, Instructor, Student, Quiz } from "@/db";
const request = require("supertest");
import { Roles } from "@/constants";
import { createAccountTokens, setupAccounts, stringify } from "test/testUtils";
import mongoose from "mongoose";

const apiRoot = `${config.api.prefix}/quiz`;
const { app } = loaders({});

let agent;

let tokens, accounts, testClass, testQuiz;

beforeEach(async () => {
  agent = request.agent(app);

  [accounts, testClass] = await setupAccounts();
  tokens = createAccountTokens(accounts);
  [testQuiz] = await Quiz.insertMany([
    {
      createdBy: accounts.instructor.id,
      class: testClass.id,
      schedule: new Date(),
    },
    {
      createdBy: accounts.admin.id,
      class: mongoose.Types.ObjectId(),
      schedule: new Date(),
    },
  ]);
});

test("POST /quiz 200 (students acess)", async () => {
  const { status } = await agent
    .post(`${apiRoot}`)
    .set("auth-token", tokens.student);
  expect(status).toBe(401);
});

test("POST /quiz 401 (badInput acess)", async () => {
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

test("POST /quiz 200 (instructor acess)", async () => {
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

test("POST /quiz 200 (admin acess)", async () => {
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

test("GET /quiz 200 (student acess)", async () => {
  const { status, body } = await agent
    .get(apiRoot)
    .set("auth-token", tokens.student);

  expect(status).toBe(200);
  expect(body.quizes).toBeTruthy();
  expect(body.quizes).toHaveLength(1);
  expect(body.quizes[0].class).toBe(`${accounts.student.class}`);
});

test("GET /quiz 200 (instructor acess)", async () => {
  const { status, body } = await agent
    .get(apiRoot)
    .set("auth-token", tokens.instructor);

  expect(status).toBe(200);
  expect(body.quizes).toBeTruthy();
  expect(body.quizes).toHaveLength(1);
  expect(body.quizes[0].createdBy).toBe(accounts.instructor.id);
  expect(body.quizes[0].class).toBe(`${accounts.instructor.class}`);
});

test("GET /quiz 200 (admin acess)", async () => {
  const { status, body } = await agent
    .get(apiRoot)
    .set("auth-token", tokens.admin);

  expect(status).toBe(200);
  expect(body.quizes).toBeTruthy();
  expect(body.quizes).toHaveLength(2);

  expect(JSON.stringify(body.quizes)).toMatch(
    `"createdBy":"${accounts.admin.id}"`
  );
  expect(JSON.stringify(body.quizes)).toMatch(
    `"createdBy":"${accounts.instructor.id}"`
  );
});
