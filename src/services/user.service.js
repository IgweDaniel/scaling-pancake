import { ErrorHandler } from "@/helpers/error";
import { User, Student, Instructor } from "@/db";

import generator from "@/helpers/generateIds";
import hashPassword from "@/helpers/hashPassword";

class UserService {
  async createUser({ role, password, classId, ...rest }) {
    try {
      return await User.create({
        ...rest,
        kind: role,
        class: classId,
        password: hashPassword(password),
      });
    } catch (error) {
      if (error.code == "11000") {
        const fieldErrorkeys = Object.keys(error.keyValue);
        const errorStr = `${fieldErrorkeys[0]}:${
          error.keyValue[fieldErrorkeys[0]]
        }`;

        let remstr = "";
        fieldErrorkeys.splice(1).forEach((key) => {
          remstr += `and ${key}:${error.keyValue[key]} `;
        });

        throw new ErrorHandler(401, `user with ${errorStr}${remstr} exist`);
      }
      console.log({ error });

      throw error;
    }
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
    return User.find({ ...filter });
  }
}

export default new UserService();
