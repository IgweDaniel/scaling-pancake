import jwt from "jsonwebtoken";
import loaders from "@/loaders";
import config from "@/config";
import { User, Token, Class, Instructor, Student, Quiz, Question } from "@/db";
const request = require("supertest");
import { QuestionTypes, Roles } from "@/constants";
import { createAccountTokens, setupAccounts, stringify } from "test/testUtils";
import mongoose from "mongoose";

const apiRoot = `${config.api.prefix}/quiz`;
const { app } = loaders({});

let agent;

let tokens, accounts, testClass, testQuiz, secondQuiz, questions;

beforeEach(async () => {
  agent = request.agent(app);

  [accounts, testClass] = await setupAccounts();
  tokens = createAccountTokens(accounts);
  [testQuiz, secondQuiz] = await Quiz.insertMany([
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

describe("The Quiz/quizId access", () => {
  beforeAll(async () => {
    questions = await Question.insertMany([
      {
        title: "Do you have the HOLYSPIRIT?",
        creator: accounts.instructor.id,
        quiz: testQuiz.id,
        kind: QuestionTypes.BOOLEAN,
        options: ["true", "false"],
        correctAnswer: "true",
      },
      {
        title: "Which of the following is/are the friuts of the HOLYSPIRIT?",
        creator: accounts.admin.id,
        quiz: testQuiz.id,
        kind: QuestionTypes.MULTI_CHOICE,
        options: ["love", "patience", "money", "dancing"],
        correctAnswers: ["love", "patience"],
      },
      {
        title: "What is the capital of Nigeria",
        creator: accounts.instructor.id,
        quiz: secondQuiz.id,
        kind: QuestionTypes.SINGLE_CHOICE,
        options: ["Anambra", "Adamawa", "Abuja"],
        correctAnswer: "Abuja",
      },
    ]);
  });

  test("GET /quiz/:quizId 200 (student access)", async () => {
    const quizId = testQuiz._id;
    const { status, body } = await agent
    .get(`${apiRoot}/${quizId}`)
    .set("auth-token", tokens.admin);

    console.log('this is the body from the quiz test', body)
    // console.log(testQuiz.createdBy.toString(), accounts.instructor.id, 'the test quiz')
  });
});
