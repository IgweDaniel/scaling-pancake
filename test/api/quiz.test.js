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

async function createDummyQuiz({ creatorId = accounts.admin.id, classId }) {
  const quiz = await Quiz.create({
    createdBy: creatorId,
    class: classId,
    schedule: new Date(),
  });

  await Question.create({
    quiz: quiz.id,
    title:
      "-------------  are words, morpheme, or phrases that means exactly or nearly the same as another word, morpheme, or phrase in a given language",
    kind: QuestionTypes.FILL_THE_GAP,
    correctAnswer: "synonyms",
    creator: creatorId,
  });
  return quiz;
}

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

test("GET /quizes 200 (admin acess)", async () => {
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

test("GET /quiz/:id 200 for student in same class with quiz class()", async () => {
  const { status, body } = await agent
    .get(`${apiRoot}/${testQuiz.id}`)
    .set("auth-token", tokens.student);

  expect(status).toBe(200);
  expect(stringify(body.quiz.questions)).toEqual(
    expect.not.stringMatching(new RegExp("answer", "i"))
  );
});

test("GET /quiz/:id 404 for student in different class to quiz class()", async () => {
  const dummyQuiz = await createDummyQuiz({
    classId: mongoose.Types.ObjectId(),
  });
  const { status, body } = await agent
    .get(`${apiRoot}/${dummyQuiz.id}`)
    .set("auth-token", tokens.student);

  expect(status).toBe(404);
  expect(body.quiz).toBeFalsy();
});

test("GET /quiz/:id 200 for instructor who created quiz", async () => {
  const dummyQuiz = await createDummyQuiz({
    classId: mongoose.Types.ObjectId(),
    creatorId: accounts.instructor.id,
  });
  const { status, body } = await agent
    .get(`${apiRoot}/${dummyQuiz.id}`)
    .set("auth-token", tokens.instructor);

  expect(status).toBe(200);
  expect(body.quiz.id).toBe(dummyQuiz.id);

  expect(stringify(body.quiz.questions)).toEqual(
    expect.stringMatching(new RegExp("answer", "i"))
  );
});

test("GET /quiz/:id 404 for instructor access when not creator", async () => {
  const dummyQuiz = await createDummyQuiz({
    classId: mongoose.Types.ObjectId(),
  });
  const { status, body } = await agent
    .get(`${apiRoot}/${dummyQuiz.id}`)
    .set("auth-token", tokens.instructor);

  expect(status).toBe(404);
  expect(body.quiz).toBeFalsy();
});

test("GET /quiz/:id 200 for admin access", async () => {
  const dummyQuiz = await createDummyQuiz({
    classId: mongoose.Types.ObjectId(),
  });
  const { status, body } = await agent
    .get(`${apiRoot}/${dummyQuiz.id}`)
    .set("auth-token", tokens.admin);

  expect(status).toBe(200);
  expect(body.quiz.id).toBe(dummyQuiz.id);
  expect(stringify(body.quiz.questions)).toEqual(
    expect.stringMatching(new RegExp("answer", "i"))
  );
});

test("GET /quiz/:id 404 for invalid quizId access", async () => {
  const { status, body } = await agent
    .get(`${apiRoot}/${mongoose.Types.ObjectId()}`)
    .set("auth-token", tokens.admin);

  expect(status).toBe(404);
  expect(body.quiz).toBeFalsy();
});
