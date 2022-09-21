import loaders from "@/loaders";
import config from "@/config";
import { User, Token, Class, Instructor, Student } from "@/db";
const request = require("supertest");
import { Roles } from "@/constants";
import hashPassword from "@/helpers/hashPassword";
import { AuthService } from "@/services";
const { app } = loaders({});
let agent;

const apiRoot = `${config.api.prefix}/users`;
let instructorToken, studentToken, adminToken, admin, student, instructor;

beforeEach(async () => {
  agent = request.agent(app);
  const password = hashPassword("mypassword");
  const userClass = await Class.create({
    name: "jssq",
    code: 403,
  });

  [admin, instructor, student] = await Promise.all([
    User.create({
      loginId: "d@ad.com",
      email: "me@mail.com",
      role: Roles.ADMIN,
      password,
    }),
    Instructor.create({
      loginId: "d@ad.com",
      email: "kayode@mail.com",
      class: userClass,
      password,
    }),
    Student.create({
      loginId: "10100000",
      email: "student@mail.com",
      class: userClass,
      password,
      fullName: "adeola tunde",
      DOB: new Date(),
    }),
  ]);

  [studentToken, instructorToken, adminToken] = [
    AuthService.signToken({
      id: student.id,
      role: student.role,
      classId: userClass.id,
    }),
    AuthService.signToken({
      id: instructor.id,
      role: instructor.role,
      classId: userClass.id,
    }),
    AuthService.signToken({
      id: admin.id,
      role: admin.role,
    }),
  ];
});

test("GET /users 401 (students acess)", async () => {
  const { status } = await agent
    .get(`${apiRoot}`)
    .set("auth-token", studentToken);

  expect(status).toBe(401);
});

test("GET /users 200 (instructor acess)", async () => {
  const { status, body } = await agent
    .get(`${apiRoot}`)
    .set("auth-token", instructorToken);

  expect(status).toBe(200);
  expect(body.users).toHaveLength(1);

  expect(body.users[0].loginId).toBe(student.loginId);
});

test("GET /users 200 (admin acess)", async () => {
  const { status, body } = await agent
    .get(`${apiRoot}`)
    .set("auth-token", adminToken);

  expect(status).toBe(200);
  expect(body.users).toHaveLength(2);
});

test("GET /users 200 (admin acess) with role filter", async () => {
  const { status, body } = await agent
    .get(`${apiRoot}`)
    .query({ role: Roles.INSTRUCTOR })
    .set("auth-token", adminToken);

  expect(status).toBe(200);
  expect(body.users).toHaveLength(1);
  expect(body.users[0].loginId).toBe(instructor.loginId);
});

test("GET /users 200 (admin acess) with role filter <Bad Input>", async () => {
  const { status } = await agent
    .get(`${apiRoot}`)
    .query({ role: "bad_role_type" })
    .set("auth-token", adminToken);

  expect(status).toBe(401);
});
