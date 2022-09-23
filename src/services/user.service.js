import { ErrorHandler } from "@/helpers/error";
import { User, Student, Instructor } from "@/db";

import generator from "@/helpers/generateIds";
import hashPassword from "@/helpers/hashPassword";

class UserService {
  async createUser({ role, password, classId, ...rest }) {
    return User.create({
      ...rest,
      kind: role,
      class: classId,
      password: hashPassword(password),
    });
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
