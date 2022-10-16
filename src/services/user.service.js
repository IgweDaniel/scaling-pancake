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

  async updateUser(id, toBeUpdated, kind) {
    if(toBeUpdated.password){
      toBeUpdated.password = hashPassword(toBeUpdated.password)
    }
    const updatedUser = await User.findOneAndUpdate({_id: id, kind}, {$set: toBeUpdated}, {new: true})
    if(updatedUser){
      return updatedUser
    }
    throw new ErrorHandler(404, 'User not found')
  }

  async listUsers(filter) {
    return User.find({ ...filter });
  }
}

export default new UserService();
