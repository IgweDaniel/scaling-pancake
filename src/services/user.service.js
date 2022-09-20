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
    try {
      const user = await User.findOne({ loginId });
      if (!user) {
        throw new ErrorHandler(404, "user not found");
      }
      return user;
    } catch (error) {
      // throw new ErrorHandler(404, error.message);
    }
  }
  async updateUser(id, { email, password }) {
    const user = await User.findById(id);
    if (!user) {
      throw new ErrorHandler(404, "user not found");
    }
  }
}

export default new UserService();
