import loaders from "@/loaders";
import config from "@/config";
import { User, Token, Class, Instructor, Student } from "@/db";
const request = require("supertest");
import { Roles } from "@/constants";
import { createAccountTokens, setupAccounts, stringify } from "test/testUtils";

const { app } = loaders({});
let agent;

const apiRoot = `${config.api.prefix}/users`;

let tokens, accounts;

beforeEach(async () => {
  agent = request.agent(app);

  accounts = await setupAccounts();
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
  const { status, body } = await agent
    .get(`${apiRoot}`)
    .query({ role: Roles.INSTRUCTOR })
    .set("auth-token", tokens.admin);

  expect(status).toBe(200);
  expect(body.users).toHaveLength(1);

  expect(body.users[0].loginId).toBe(accounts.instructor.loginId);
});

test("GET /users 200 (admin acess) with role filter <Bad Input>", async () => {
  const { status } = await agent
    .get(`${apiRoot}`)
    .query({ role: "bad_role_type" })
    .set("auth-token", tokens.admin);

  expect(status).toBe(401);
});
