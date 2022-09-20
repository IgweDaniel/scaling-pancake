import { ErrorHandler } from "@/helpers/error";

import { User, Token } from "@/db";

import config from "@/config";

class MailService {
  forgotPasswordMail(link) {
    return true;
  }
}

export default new MailService();
