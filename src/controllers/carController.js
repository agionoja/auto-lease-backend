import { catchAsync } from "../utils/helpers.js";
import Car from "../models/carModel.js";
import {
  cloudinary,
  cloudinaryImageUpdater,
  cloudinaryImageUploader,
} from "../utils/imageUploader.js";
import AppError from "../utils/appError.js";
import * as service from "../services/carService.js";
import * as factory from "../controllers/handlerFactory.js";

import Dealership from "../models/dealershipModel.js";

export const setDealershipId = (req, res, next) => {
  if (!req.body.dealership) req.body.dealership = req.params.id;
  next();
};

export const getAllCars = factory.getAll(service.getAllCars, (req) => {
  const filter = req.params.id ? { dealership: req.params.id } : {};
  return { filter };
});

export const createCar = factory.createOne(

  service.createCar
);
export const getCar = factory.getById(service.getCar);
export const updateCar = factory.updateById(service.updateCar);
export const deleteCar = factory.deleteById(service.deleteCar);
