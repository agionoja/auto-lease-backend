import AppError from "../utils/appError.js";
import {
  cloudinaryImageUpdater,
  cloudinaryImageUploader,
} from "../utils/imageUploader.js";
import { catchAsync } from "../utils/helpers.js";
import * as service from "../services/userService.js";
import * as factory from "./handlerFactory.js";

export const getUser = factory.getById(service.getUser);

export const updateUser = factory.updateById(service.updateUser);

export const deleteUser = factory.deleteById(service.deleteUser);

export const getAllUsers = factory.getAll(service.getAllUsers);

export const deleteManyUsers = factory.deleteMany(service.deleteManyUsers);

export const createUser = catchAsync(async (req, res, next) => {
  return next(
    new AppError(
      "This route is not yet defined! Please use /auth/sign-up",
      500,
    ),
  );
});

export const getMe = (req, res) => {
  res.status(200).json({
    statusText: "success",
    data: { user: req.user },
  });
};

export const updateMyPassword = catchAsync(async (req, res) => {
  const { user } = await service.updateMyPassword(user, req.body);

  res.status(200).json({
    statusText: "success",
    data: { user },
  });
});

export const updateMe = catchAsync(async (req, res) => {

  const result = req.user.photo
    ? await cloudinaryImageUpdater(req.file.buffer, req.user.photo.id)
    : await cloudinaryImageUploader(req.file.buffer);

  req.body.photo = {
    url: result.secure_url,
    id: result.public_id,
  };

  const { user } = await service.updateMe(req.body, req.user.id);

  console.log(req.body);

  res.status(200).json({
    statusText: "success",
    data: { user },
  });
});

export const deleteMe = catchAsync(async (req, res) => {
  await service.deleteMe(req.user, req.body.password);

  res.status(204).json({
    statusText: "success",
    message: "Your account has been successfully deleted",
  });
});

export const applyForDealership = catchAsync(async (req, res) => {
  const { message } = await service.applyForDealership(req.body, req.user);

  res.status(200).json({
    statusText: "success",
    message,
  });
});

export const approveDealership = catchAsync(async (req, res) => {
  const { user } = await service.approveDealership(req.params.id);

  res.status(200).json({
    statusText: "success",
    data: { user },
  });
});

export const rejectDealership = catchAsync(async (req, res) => {
  const { user } = await service.rejectDealership(
    req.params.id,
    req.body.reason,
  );

  res.status(200).json({
    statusText: "success",
    data: { user },
  });
});

export const revokeDealership = catchAsync(async (req, res) => {
  const { user } = await service.revokeDealership(
    req.params.id,
    req.body.reason,
  );

  res.status(200).json({
    statusText: "success",
    data: { user },
  });
});
