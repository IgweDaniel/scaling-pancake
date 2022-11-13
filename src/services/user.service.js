import { ErrorHandler } from "@/helpers/error";
import { User, Student, Instructor } from "@/db";

import generator from "@/helpers/generateIds";
import hashPassword from "@/helpers/hashPassword";
import { Roles } from "@/constants";

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
    const user = await User.findById(id)  //the user to be updated so i can find the kind and class
    if(!user) throw new ErrorHandler(404, 'User not found')
    const canUpdate = (authUser.role===Roles.ADMIN || authUser.classId.toString() == user.class.toString() || authUser.id == user.id)
    if(!canUpdate){
      throw new ErrorHandler(403, 'Permission Denied')
    }
    const kind = user.role
    if(toBeUpdated.password){
      toBeUpdated.password = hashPassword(toBeUpdated.password)
    }
    const updatedUser = await User.findOneAndUpdate({_id: id, kind}, {$set: toBeUpdated}, {new: true})
    return updatedUser
  }

  async deleteUserById(id, authUser){
    const user = await User.findById(id)
    const canDelete = (authUser.role===Roles.ADMIN || authUser.classId.toString() == user.class.toString() || authUser.id == user.id)
    if(!canDelete){
      throw new ErrorHandler(403, 'Permission Denied')
    }
    await User.findByIdAndDelete(id)
    return 'User has been deleted'
  }

  async listUsers(filter) {
    return User.find({ ...filter });
  }
}

export default new UserService();
