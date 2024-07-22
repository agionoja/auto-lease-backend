import Email from "./email.js";
import AppError from "./appError.js";
import { isProduction } from "./helpers.js";
import { BASE_URL } from "./constants.js";
import {
  destroyVerificationTokenAndSave,
  generateAndSaveVerificationToken,
} from "./userHelper.js";

export default class SendVerificationToken {
  constructor(user) {
    this.user = user;
  }

  async init() {
    this.token = await generateAndSaveVerificationToken(this.user);
    this.url = `${BASE_URL}/auth/verify/${this.token}`;

    // console.log(this.token);
    this.successMsg =
      "verification email sent! Please check your inbox to verify your account.";
    this.failMsg =
      "An error occurred while sending the verification email. Please try again later.";
  }

  async sendEmail() {
    try {
      await new Email(this.user, { url: this.url }).sendVerification();
    } catch (err) {
      isProduction && console.log(err);
      await destroyVerificationTokenAndSave(this.user);
      throw new AppError(this.failMsg, 500);
    }
  }

  async creationSender() {
    await this.init();
    await this.sendEmail();
    return {
      message: this.successMsg,
      token: isProduction ? undefined : this.token,
    };
  }

  async notVerifiedButTrySignInSender() {
    await this.sendEmail();
    throw new AppError(
      "Your account is not verified. Please check your inbox to verify your account.",
      401,
    );
  }

  async verificationSender() {
    await this.init();
    await this.sendEmail();
    return { message: this.successMsg };
  }
}
