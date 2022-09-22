import { ErrorHandler } from "@/helpers/error";
import { User, Student, Instructor } from "@/db";

import generator from "@/helpers/generateIds";
import hashPassword from "@/helpers/hashPassword";

class UserService {
  async createStudent({ fullName, classId, DOB, password }) {
    try {
      const student = await Student.create({
        role: Roles.STUDENT,
        loginId: generator.stuLoginID(),
        DOB,
        fullName,
        classId,
        password: hashPassword(password),
      });
      return student;
    } catch (error) {}
  }

  async createUser({ role, password, classId, ...rest }) {
    return User.create({
      ...rest,
      kind: role,
      class: classId,
      password: hashPassword(password),
    });
  }

  async createInstructor({ email, classId, password }) {
    try {
      const instructor = await Instructor.create({
        role: Roles.INSTRUCTOR,
        loginId: email,
        email,
        classId,
        password: hashPassword(password),
      });
      return instructor;
    } catch (error) {}
  }

  async getUserByLoginID(loginId) {
    const user = await User.findOne({ loginId });
    if (!user) {
      throw new ErrorHandler(404, "user not found");
    }
    return user;
  }

  async updateUser(id, { email, password }) {
    const user = await User.findById(id);
    if (!user) {
      throw new ErrorHandler(404, "user not found");
    }
  }

  async listUsers(filter) {
    const users = await User.find({ ...filter });
    return users;
  }
}

export default new UserService();
