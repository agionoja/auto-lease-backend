import express from "express";
import * as carController from "../controllers/carController.js";
import { protect, restrictTo } from "../middlewares/guard.js";
import { ROLES } from "../utils/constants.js";
import { upload, uploadMultiple } from "../utils/imageUploader.js";
import { ensureValidObject, uploadCoverImage } from "../middlewares/x.js";

const router = express.Router({ mergeParams: true });
const { DEALER, ADMIN } = ROLES;

router
  .route("/")
  .post(
    protect,
    restrictTo(DEALER, ADMIN),
    carController.setDealershipId,
    upload.fields([
      { name: "coverImage", maxCount: 1 },
      { name: "photos", maxCount: 10 },
    ]),
    uploadCoverImage,
    uploadMultiple,
    carController.createCar,
  )
  .get(carController.getAllCars);

router
  .route("/:id")
  .get(carController.getCar)
  .delete(protect, restrictTo(ADMIN, DEALER), carController.deleteCar)
  .patch(protect, restrictTo(ADMIN, DEALER), carController.updateCar);
router
  .route("/")
  .post(
    protect,
    upload.array("photos"),
    uploadMultiple,
    carController.createCarV1,
  )
  .get(carController.getAllCars);
router
  .route("/:id")
  .get(carController.getCar)
  .patch(upload.array("photos"), carController.updateCar);

export default router;
