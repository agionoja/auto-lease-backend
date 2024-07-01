import bcrypt from "bcrypt";
import {
  createHash,
  createRandomBytes,
  createTimeStampInEpoch,
  generateOtp,
} from "./utils.js";

export const passwordChangedAfterJwt = function (jwtIat, passwordChangedAt) {
  if (passwordChangedAt) {
    return passwordChangedAt.getTime() / 1000 > jwtIat;
  }
  return false;
};

export const comparePassword = async (password, hashedPassword) =>
  await bcrypt.compare(password, hashedPassword);

export const generateAndSaveOtp = async (user) => {
  const otp = generateOtp(6);
  user.otp = createHash(otp);
  user.otpExpires = createTimeStampInEpoch({ m: 2 });
  await user.save({ validateBeforeSave: false });
  return otp;
};

export const destroyOtpAndSave = async (user) => {
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save({ validateBeforeSave: false });
};

export const generateAndSavePasswordResetToken = async (user) => {
  const token = await createRandomBytes(32);
  user.passwordResetToken = createHash(token);
  user.passwordResetTokenExpires = createTimeStampInEpoch({ m: 10 });
  await user.save({ validateBeforeSave: false });
  return token;
};

export const destroyPasswordResetTokenAndSave = async (user) => {
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();
};

export const confirmUserAndSave = async (user) => {
  user.isUserConfirmed = true;
  user.userConfirmationToken = undefined;
  user.userConfirmationTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });
};

export const generateAndSaveUserConfirmationToken = async (user) => {
  const token = await createRandomBytes(32);
  user.userConfirmationToken = createHash(token);
  user.userConfirmationTokenExpires = createTimeStampInEpoch({ m: 10 });
  await user.save({ validateBeforeSave: false });
  return token;
};

export const destroyUserConfirmationTokenAndSave = async (user) => {
  user.userConfirmationToken = undefined;
  user.userConfirmationToken = undefined;
  user.save({ validateBeforeSave: false });
};
