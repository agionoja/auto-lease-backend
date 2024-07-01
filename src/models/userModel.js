import mongoose from "mongoose";
import bcrypt from "bcrypt";
import AppError from "../utils/appError.js";
import {
  createHash,
  createRandomBytes,
  createTimeStampInEpoch,
  generateOtp,
} from "../utils/utils.js";

import { DEALERSHIP_APPLICATION_STATUS, ROLES } from "../utils/constants.js";
import pointSchema from "./pointSchema.js";

const { APPROVED, PENDING, REJECTED } = DEALERSHIP_APPLICATION_STATUS;
const { USER, DEALER, ADMIN, Driver } = ROLES;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [4, "name cannot be less than 4 characters"],
      maxlength: [50, "name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      validate: {
        validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Invalid email address",
      },
    },
    role: {
      type: String,
      default: USER,
      enum: {
        values: [USER, DEALER, DEALER, ADMIN],
        message: `Invalid role. Choose from: ${USER},${DEALER}, ${Driver}, ${ADMIN}`,
      },
    },
    dealershipApplicationStatus: {
      type: String,
      enum: {
        values: [APPROVED, PENDING, REJECTED],
        message: `Invalid dealership application status. Choose from: ${APPROVED}, ${PENDING} and ${REJECTED}`,
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      select: false,
      validate: {
        validator: (value) =>
          /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,50}$/.test(value),
        message: ({ value }) => {
          if (value.length < 8) {
            return "Password must be at least 8 characters";
          }
          if (value.length > 50) {
            return "Password must be at most 50 characters";
          }
          if (!/[A-Z]/.test(value)) {
            return "Password must contain at least one uppercase letter";
          }
          if (!/[!@#$%^&*]/.test(value)) {
            return "Password must contain at least one special character";
          }
          return "Invalid password";
        },
      },
    },
    passwordConfirm: {
      type: String,
      required: [true, "Confirm password is required"],
      validate: {
        validator: function (value) {
          return value === this.password;
        },
        message: "Passwords do not match",
      },
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetTokenExpires: {
      type: Date,
      select: false,
    },
    userConfirmationToken: {
      type: String,
      select: false,
    },
    userConfirmationTokenExpires: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
    photo: String,
    driversLicense: String,
    location: pointSchema,
    isUserConfirmed: Boolean,
    isApplyForDealership: Boolean,
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 13);
    this.passwordConfirm = undefined;
  }
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isNew && this.isModified("password")) {
    this.passwordChangedAt = Date.now() - 1000;
  }
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
  next();
});

userSchema.methods.dealershipApplicationResponse = async function (status) {
  if (this.dealershipApplicationStatus === APPROVED) {
    throw new AppError("Cannot modify an already application", 403);
  }
  this.dealershipApplicationStatus = status;
  await this.save({ validateBeforeSave: false });
};

userSchema.methods.revokeDealershipApplication = async function () {
  if (this.dealershipApplicationStatus !== APPROVED) {
    throw new AppError("Only approved applications can be revoked", 403);
  }
  this.dealershipApplicationStatus = REJECTED;
  await this.save({ validateBeforeSave: false });
};

const User = mongoose.model("User", userSchema);

export default User;
