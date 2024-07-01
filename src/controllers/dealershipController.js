import AppError from "../utils/appError.js";
import AppQueries from "../utils/appQueries.js";
import { catchAsync, filterObject, isProduction } from "../utils/utils.js";
import Dealership from "../models/dealershipModel.js";
import User from "../models/userModel.js";
import { ROLES } from "../utils/constants.js";

const { ADMIN, DEALER } = ROLES;

export const createDealership = catchAsync(async (req, res, next) => {
  const { user } = req;
  const id = user?.role === ADMIN ? req.params?.id : user?._id;

  if (await Dealership.findOne({ owner: id }, {}, { lean: true }).exec()) {
    return next(new AppError("Dealership with this user already exists", 409));
  }

  if (user?.role === ADMIN) {
    // This user has shadowed the higher scoped user and will represent the queried user
    const user = await User.findById(id, {}, { lean: true }).exec();
    if (!user) {
      return next(new AppError("User with this ID those not exit", 404));
    }

    if (!user.isUserConfirmed) {
      return next(new AppError("User is not confirmed", 401));
    }

    if (user.role === ADMIN) {
      return next(new AppError("Admins cannot have a dealership", 403));
    }
  }

  const payload = filterObject(
    req.body,
    isProduction
      ? [
          "isApproved",
          "isRejected",
          "slug",
          "ratingsAverage",
          "ratingsQuantity",
        ]
      : [""],
    {
      exclude: true,
    },
  );

  payload.owner = id;
  const dealership = await Dealership.create(payload);

  res.status(202).json({
    statusText: "success",
    data: { dealership },
  });
});

export const getDealership = catchAsync(async (req, res, next) => {
  let dealership;
  const isAuthorized = req.user?.role === ADMIN || req.user?.role === DEALER;

  if (isAuthorized) {
    dealership = await Dealership.findById(req.params.id, {}, { lean: true })
      .select("+cacCertificate +isApproved +dealershipLicence")
      .exec();
  } else {
    dealership = await Dealership.findById(
      req.params.id,
      {},
      { lean: true },
    ).exec();
  }

  if (!dealership) {
    return next(new AppError("Dealership not found", 404));
  }

  res.status(200).json({
    statusText: "success",
    data: { dealership },
  });
});

export const getAllDealerships = catchAsync(async (req, res, next) => {
  const isAdmin = req.user?.role === ADMIN;
  let appQueries;

  if (isAdmin) {
    appQueries = new AppQueries(
      req.query,
      Dealership.find({}, {}, { lean: true }),
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();
  } else {
    appQueries = new AppQueries(
      req.query,
      Dealership.find({}, {}, { lean: true }),
    )
      .filter()
      .sort()
      .paginate();
  }

  const dealerships = await appQueries.query;

  res.status(200).json({
    statusText: "success",
    numResult: dealerships.length,
    data: { dealerships },
  });
});

export const updateMyDealership = catchAsync(async (req, res, next) => {
  const payload = filterObject(
    req.body,
    [
      "slug",
      "isRejected",
      "isApproved",
      "owner",
      "ratingsAverage",
      "ratingsQuantity",
      "dealershipLicence",
      "cacCertificate",
    ],
    { exclude: true },
  );

  const updateDealership = await Dealership.findOneAndUpdate(
    { owner: req.user?._id },
    payload,
    { includeResultMetadata: true, lean: true, new: true },
  ).exec();

  if (!updateDealership) {
    return next(
      new AppError("No dealership associated with this user was found", 404),
    );
  }

  res.status(200).json({
    statusText: "success",
    data: { updateDealership },
  });
});

export const updateMyDealershipCerts = catchAsync(async (req, res, next) => {
  const userId = req.user?._id;
  const payload = filterObject(req.body, [
    "cacCertificate",
    "dealershipLicence",
    "password",
  ]);

  if (!payload.password) {
    return next(
      new AppError("Password is required to carry out this operation", 403),
    );
  }

  const user = await User.findById(userId).exec();

  if (!(await user.comparePassword(payload.password, user.password))) {
    return next(new AppError("Password is incorrect", 403));
  }

  // Remove the password from the payload
  delete payload.password;

  const updatedDealership = await Dealership.findOneAndUpdate(
    { owner: userId },
    payload,
    { new: true, lean: true, includeResultMetadata: true },
  ).exec();

  if (!updatedDealership) {
    return next(
      new AppError("No dealership associated with this user was found", 404),
    );
  }

  res.status(200).json({
    statusText: "success",
    data: { updatedDealership },
  });
});

export const deleteMyDealership = catchAsync(async (req, res, next) => {});

export const updateDealership = catchAsync(async (req, res, next) => {});
export const deleteDealership = catchAsync(async (req, res, next) => {});
