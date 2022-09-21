import jwt from "jsonwebtoken";
import { ErrorHandler } from "@/helpers/error";
import { randomId } from "@/helpers/generateIds";
import { User, Token } from "@/db";
import bcrypt from "bcryptjs";
import config from "@/config";
import { TokenTypes } from "@/constants";
import hashPassword from "@/helpers/hashPassword";

class AuthService {
  async login({ loginId, password }) {
    const user = await User.findOne({ loginId });
    if (!user) {
      throw new ErrorHandler(401, "invalid user creds");
    }
    const passValid = bcrypt.compareSync(password, user.password);

    if (!passValid) {
      throw new ErrorHandler(401, "invalid user creds");
    }
    const payload = {
      id: user.id,
      role: user.role,
      classId: user.class,
    };

    const token = await this.signToken(payload);
    const refreshToken = await this.signRefreshToken(payload);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async generateRefreshToken(data) {
    const payload = await this.verifyRefreshToken(data);

    const token = await this.signToken(payload);
    const refreshToken = await this.signRefreshToken(payload);

    return {
      token,
      refreshToken,
    };
  }
  signRefreshToken(data) {
    try {
      return jwt.sign(data, config.refreshSecret, { expiresIn: "1h" });
    } catch (error) {
      logger.error(error);
      throw new ErrorHandler(500, error.message);
    }
  }
  signToken(data) {
    try {
      return jwt.sign(data, config.secret, { expiresIn: "60s" });
    } catch (error) {
      throw new ErrorHandler(500, "An error occurred");
    }
  }

  async verifyRefreshToken(token) {
    try {
      const payload = jwt.verify(token, config.refreshSecret);
      return {
        id: payload.id,
        role: payload.role,
        classId: payload.classId,
      };
    } catch (error) {
      throw new ErrorHandler(500, error.message);
    }
  }

  async passwordResetLink(email) {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new ErrorHandler(400, "nonexistent mail");
      }

      //Create a random reset token
      const tokenId = randomId();

      await Token.create({
        userId: user.id,
        tokenId,
        for: TokenTypes.RESET_PASSWORD,
      });

      // Send it to mail using mail service
      const resetLink = `${config.websiteUrl}auth/reset/${tokenId}`;
      return resetLink;
    } catch (error) {
      throw new ErrorHandler(error.statusCode, error.message);
    }
  }
  async resetPassword({ tokenId, password }) {
    try {
      const token = await Token.findOneAndDelete({
        tokenId,
        for: TokenTypes.RESET_PASSWORD,
      }).populate("userId");

      const user = token?.userId;

      if (!token || !user) {
        throw new ErrorHandler(400, "malformed token");
      }
      const then = new Date(token.createdAt).getTime();

      if ((then - Date.now()) / 36e5 > 1) {
        throw new ErrorHandler(400, "malformed token");
      }
      user.password = hashPassword(password);
      await user.save();
    } catch (error) {
      throw new ErrorHandler(error.statusCode, error.message);
    }
  }
}

export default new AuthService();
