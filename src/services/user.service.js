import { ErrorHandler } from "@/helpers/error";
import { User, Student, Instructor } from "@/db";

import generator from "@/helpers/generateIds";
import hashPassword from "@/helpers/hashPassword";
import { Roles } from "@/constants";

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

  async updateUserById(id, authUser, toBeUpdated){
    if(toBeUpdated.password){
      toBeUpdated.password = hashPassword(toBeUpdated.password)
    }
    const user = await User.findById(id)  //the user to be updated so i can find the kind and class
    const kind = user.role
    const canUpdate = (authUser.role===Roles.ADMIN || authUser.classId.toString() == user.class.toString() || authUser.id == user.id)
    if(!canUpdate){
      throw new ErrorHandler(403, 'Permission Denied')
    }
    const updatedUser = await User.findOneAndUpdate({_id: id, kind}, {$set: toBeUpdated}, {new: true})
    return updatedUser
  }

  async listUsers(filter) {
    return User.find({ ...filter });
  }
}

export default new UserService();
