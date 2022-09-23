import { ErrorHandler } from "@/helpers/error";

import { User, Token } from "@/db";

import config from "@/config";

class MailService {
  async forgotPasswordMail(link, email) {
    console.log(`Email sent to ${email} with ${link} `);
  }
}

export default new MailService();
