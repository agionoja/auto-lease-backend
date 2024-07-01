import express from "express";
import * as dealershipController from "../controllers/dealershipController.js";
import { protect, restrictTo } from "../controllers/authController.js";
import { ROLES } from "../utils/constants.js";

const router = express.Router();
const { ADMIN, DEALER } = ROLES;

router.patch(
  "/update-my-dealership",
  protect,
  restrictTo(DEALER),
  dealershipController.updateMyDealership,
);

router.patch(
  "/update-my-dealership/certificates",
  protect,
  restrictTo(DEALER),
  dealershipController.updateMyDealershipCerts,
);

router.get(
  "/restricted/:id",
  protect,
  restrictTo(ADMIN, DEALER),
  dealershipController.getDealership,
);

router.get(
  "/restricted",
  protect,
  restrictTo(ADMIN),
  dealershipController.getAllDealerships,
);

router
  .route("/")
  .get(dealershipController.getAllDealerships)
  .post(protect, restrictTo(DEALER), dealershipController.createDealership);

router
  .route("/:id")
  .get(dealershipController.getDealership)
  .post(protect, restrictTo(ADMIN), dealershipController.createDealership);

router.route("/").post(dealershipController.createDealership);

export default router;
