import hashPassword from "@/helpers/hashPassword";
import { User, Token, Class, Instructor, Student } from "@/db";
import { Roles } from "@/constants";
import { AuthService } from "@/services";
import mongoose from "mongoose";

export const stringify = JSON.stringify;

export const createToken = (user) => {
  return AuthService.signToken({
    id: user.id,
    role: user.role,
    classId: user.class,
  });
};

export async function setupAccounts() {
  const password = hashPassword("mypassword");
  const fakeClassId = new mongoose.Types.ObjectId();

  const [admin, instructor, student] = await User.insertMany([
    { loginId: "d@ad.com", email: "me@mail.com", role: Roles.ADMIN, password },
    {
      loginId: "d@ad.com",
      email: "kayode@mail.com",
      class: fakeClassId,
      password,
      kind: Roles.INSTRUCTOR,
    },
    {
      loginId: "10100000",
      email: "student@mail.com",
      class: fakeClassId,
      password,
      fullName: "adeola tunde",
      DOB: new Date(),
      kind: Roles.STUDENT,
    },
  ]);
  return { admin, instructor, student };
}

export function createAccountTokens(accounts) {
  const tokens = {};
  for (const key in accounts) {
    if (Object.hasOwnProperty.call(accounts, key)) {
      const user = accounts[key];
      tokens[key] = createToken(user);
    }
  }

  return tokens;
}
