import AppError from "../utils/appError.js";
import Email from "../utils/email.js";
import * as factory from "../services/serviceFactory.js";
import Dealership from "../models/dealershipModel.js";
import User from "../models/userModel.js";
import { ROLES } from "../utils/constants.js";
import { filterObject, isProduction } from "../utils/helpers.js";
import { comparePassword } from "../utils/userHelper.js";

const { ADMIN, DEALER, USER } = ROLES;

export const createDealership = async (reqBody, userId, options = {}) => {
  const { createdByAdmin } = options;
  let user;
  if (createdByAdmin) {
    user = await User.findById(userId).exec();

    if (!user) {
      throw new AppError("No user found with this ID", 404);
    }

    if (!user.isVerified) {
      throw new AppError("User is not verified", 403);
    }

    if (user.role === DEALER) {
      throw new AppError("User is already a dealer", 409);
    }

    if (user.role === ADMIN) {
      throw new AppError("Admins cannot have a dealership", 403);
    }
  } else {
    user = options.currentUser;
  }

  if (await Dealership.exists({ owner: user._id }).exec()) {
    throw new AppError("Dealership with this user already exists", 409);
  }

  const payload = filterObject(
    reqBody,
    isProduction
      ? [
          "slug",
          "isApproved",
          "owner",
          "reputation",
          "dealershipLicence",
          "cacCertificate",
        ]
      : [""],
    { exclude: true },
  );

  payload.owner = userId;
  payload.isApproved = createdByAdmin || false;
  const dealership = await Dealership.create(payload);

  if (createdByAdmin) {
    try {
      user.role = DEALER;
      user.applicationStatus = undefined; // in case this user has applied

      await user.save({ validateBeforeSave: false });

      try {
        await new Email(user, {
          createdByAdmin: true,
        }).sendApprovedDealership();
      } catch (err) {
        isProduction && console.log(err);
      }
    } catch (err) {
      user.role = USER;
      await user.save({ validateBeforeSave: false });
      await Dealership.findOneAndDelete({ owner: user.id }, { lean: true })
        .setOptions({ bypass: true })
        .exec();

      throw new AppError("There was an error creating the dealership.", 500);
    }
  }

  return { dealership, user };
};

export const getDealership = async (dealershipId) =>
  await factory.getOneById(Dealership, dealershipId);

export const getAllDealerships = async (query) =>
  await factory.getAll(Dealership, query, {}, (q) => q.lean());

export const deleteDealership = async (dealershipId) =>
  await factory.deleteById(Dealership, dealershipId);

export const updateDealership = async (reqBody, userId) =>
  factory.updateById(
    Dealership,
    userId,
    filterObject(reqBody, ["slug", "isApproved", "owner"], { exclude: true }),
  );
