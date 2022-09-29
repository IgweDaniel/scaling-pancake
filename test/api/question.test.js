import jwt from "jsonwebtoken";
import loaders from "@/loaders";
import config from "@/config";
import { User, Token, Class, Instructor, Student, Quiz } from "@/db";
const request = require("supertest");
import { QuestionTypes, Roles } from "@/constants";
import { createAccountTokens, setupAccounts, stringify } from "test/testUtils";
import mongoose from "mongoose";
import { restart } from "nodemon";

const apiRoot = `${config.api.prefix}/questions`;
const { app } = loaders({});

let agent;

let tokens, accounts, testClass, testQuiz;

beforeAll(async () => {
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

test("POST /quiz 401 (badInput acess for options required QuestionTypes)", async () => {
  const { status, body } = await agent
    .post(`${apiRoot}`)
    .set("auth-token", tokens.admin)
    .send({
      quizId: testQuiz.id,
      title: "a woman is synonymous to which of the following",
      kind: QuestionTypes.MULTI_CHOICE,
      answers: ["female", "lass", "lady"],
    });

  expect(status).toBe(401);
  expect(body.error).toHaveProperty("options");
});

const cases = [
  {
    title: "a woman is synonymous to which of the following",
    kind: QuestionTypes.MULTI_CHOICE,
    options: ["female", "lass", "male", "lady", "gent"],
    answers: ["female", "lass", "lady"],
    hasOptions: true,
  },

  {
    title: "a woman is synonymous to which of the following",
    kind: QuestionTypes.SINGLE_CHOICE,
    options: ["lass", "bloke", "gent"],
    answers: ["lass"],
    hasOptions: true,
  },
  {
    title: "man is a mamal",
    kind: QuestionTypes.BOOLEAN,
    options: ["true", "false"],
    answers: ["true"],
    hasOptions: true,
  },

  {
    title:
      "-------------  are words, morpheme, or phrases that means exactly or nearly the same as another word, morpheme, or phrase in a given language",
    kind: QuestionTypes.FILL_THE_GAP,
    answers: ["synonyms"],
    hasOptions: false,
  },
];

test.each(cases)(
  "POST /quiz 200 <$kind>",
  async ({ kind, hasOptions, ...rest }) => {
    const { status, body } = await agent
      .post(`${apiRoot}`)
      .set("auth-token", tokens.admin)
      .send({ quizId: testQuiz.id, kind, ...rest });

    expect(status).toBe(200);
    expect(body.question.quiz).toBe(testQuiz.id);
    expect(body.question.kind).toBe(kind);
    if (hasOptions) {
      expect(body.question.options).toBeTruthy();
    } else {
      expect(body.question.options).toBeFalsy();
    }
  }
);
