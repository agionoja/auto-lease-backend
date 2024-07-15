import { catchAsync } from "../utils/helpers.js";
import Car from "../models/carModel.js";
import { cloudinary, cloudinaryImageUploader } from "../utils/imageUploader.js";
import AppError from "../utils/appError.js";
import * as service from "../services/carService.js";
import * as factory from "../controllers/handlerFactory.js";

import Dealership from "../models/dealershipModel.js";



export const createCarV1 = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const dealership = await Dealership.findOne(
      { car: { _id: userId } },
      { _id: 1 },
      { lean: true },
  ).exec();
  if (!dealership) {
    return next(new AppError("No dealership found with this ID", 404));
  }
  const payload = filterObject(req.body, ["slug", "isAvailable"], {
    exclude: true,
  });
  
  payload.dealership = dealership._id;
  payload.images = req.photos;
  payload.imageIds = req.photosId;
  const car = await Car.create(payload);

  res.status(201).json({
    statusText: "success",
    data: { car },
  });
});

export const setDealershipId = (req, res, next) => {
  if (!req.body.dealership) req.body.dealership = req.params.id;
  next();
};

export const getAllCars = factory.getAll(service.getAllCars, (req) => {
  const filter = req.params.id ? { dealership: req.params.id } : {};
  return { filter };
});

export const createCar = factory.createOne(service.createCar);
export const getCar = factory.getById(service.getCar);
export const updateCar = factory.updateById(service.updateCar);
export const deleteCar = factory.deleteById(service.deleteCar);
