import AppError from "../utils/appError.js";
import Email from "../utils/email.js";
import SendVerificationToken from "../utils/sendVerificationToken.js";
import User from "../models/userModel.js";
import { BASE_URL } from "../utils/constants.js";
import {
  createHash,
  createRandomBytes,
  createTimeStampInEpoch,
  filterObject,
  generateOtp,
  isProduction,
} from "../utils/helpers.js";
import {
  comparePassword,
  destroyOtpAndSave,
  destroyPasswordReset,
} from "../utils/userHelper.js";

export const signUp = async (req) => {
  const payload = filterObject(req.body, [
    "name",
    "email",
    "password",
    "passwordConfirm",
  ]);

  const user = await User.create(payload);
  const { message } = await new SendVerificationToken(user).creationSender();

  return {
    message,
    user,
  };
};

export const requestVerification = async (req) => {
  const email = req.body.email || req.user?.email;

  if (!email) {
    throw new AppError(
      "Email is required to request a verification token.",
      400,
    );
  }

  const user = await User.findOne({ email }).select("+isVerified").exec();

  if (!user) {
    throw new AppError("No user found with the provided email address.", 404);
  }

  if (user.isVerified) {
    throw new AppError("You are already a verified user.", 409);
  }

  const { message } = await new SendVerificationToken(
    user,
  ).verificationSender();

  console.log();
  return {
    message,
  };
};

export const verifyUser = async (token) => {
  if (!token) {
    throw new AppError(
      "verification token is required to verify your account.",
      400,
    );
  }

  const user = await User.findOne({
    verificationToken: createHash(token),
    verificationTokenExpires: { $gt: Date.now() },
  })
    .select("+isVerified")
    .exec();

  if (!user) {
    throw new AppError(
      "The token provided is either incorrect or has expired.",
      401,
    );
  }

  if (user.isVerified) {
    throw new AppError("You are already a verified user.", 409);
  }
  // verify user
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  user.save({ validateBeforeSave: false });

  const url = `${BASE_URL}/users/account`;

  await new Email(user, { url }).sendWelcome();

  return {
    message:
      "Your account has been successfully verified! You can now log in with your credentials.",
  };
};

export const signIn = async (password, email) => {
  if (!password || !email) {
    throw new AppError("Both password and email are required.", 401);
  }

  const user = await User.findOne({ email })
    .select("+password +isVerified")
    .exec();

  if (!user || !(await comparePassword(password, user.password))) {
    throw new AppError("Incorrect password or email.", 401);
  }

  // if (!user.isVerified) {
  //   await new SendVerificationToken(user).notVerifiedButTrySignInSender();
  // }

  const otp = generateOtp(6);
  console.log({ otp });
  user.otp = createHash(otp);
  user.otpExpires = createTimeStampInEpoch({ m: 2 });
  await user.save({ validateBeforeSave: false });

  try {
    await new Email(user, { otp }).sendOtp(2);

    return {
      message: "An OTP has been sent to your email.",
      otp: isProduction ? undefined : otp, // TODO: remove this when done
    };
  } catch (err) {
    await destroyOtpAndSave(user);
    throw new AppError(
      isProduction
        ? "There was an error sending the OTP. Please try again."
        : `There was an error sending the OTP: ${err.message}`,
      500,
    );
  }
};

export const signIn2fa = async (otp) => {
  if (!otp) {
    throw new AppError("OTP is required to verify your login.", 400);
  }

  const user = await User.findOne({
    otp: createHash(otp),
    otpExpires: { $gt: Date.now() },
  }).exec();

  if (!user) {
    throw new AppError(
      "The OTP provided is either incorrect or has expired.",
      401,
    );
  }
  await destroyOtpAndSave(user);
  return { user };
};

export const forgotPassword = async (email) => {
  if (!email) {
    throw new AppError("Email is required to reset password.", 400);
  }

  const user = await User.findOne({ email }).exec();

  if (!user) {
    throw new AppError("No user found with the provided email address.", 404);
  }

  const token = await createRandomBytes(32);
  user.passwordResetToken = createHash(token);
  user.passwordResetTokenExpires = createTimeStampInEpoch({ m: 10 });
  await user.save({ validateBeforeSave: false });

  const url = `${BASE_URL}/auth/reset-password/${token}`;

  try {
    await new Email(user, { url }).sendPasswordReset();

    return {
      message: `Please check the email address ${email} for instructions to reset your password.`,
    };
  } catch (err) {
    await destroyPasswordReset(user);
    await user.save({ validateBeforeSave: false });
    throw new AppError(
      "There was an error sending the password reset email.",
      500,
    );
  }
};

export const resetPassword = async (token, password, passwordConfirm) => {
  if (!token) {
    throw new AppError("Password reset token is required.", 400);
  }

  if (!password || !passwordConfirm) {
    throw new AppError(
      "Both password and password verification are required.",
      401,
    );
  }

  const user = await User.findOne({
    passwordResetToken: createHash(token),
    passwordResetTokenExpires: { $gt: Date.now() },
  })
    .select("+password")
    .exec();

  if (!user) {
    throw new AppError(
      "The reset token provided is either incorrect or has expired.",
      401,
    );
  }

  if (await comparePassword(password, user.password)) {
    throw new AppError(
      "The new password cannot be the same as the old password.",
      400,
    );
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await destroyPasswordReset(user);
  await user.save();

  return {
    message: "Password reset successful. Please log in with your new password.",
  };
};
