import express from "express";
import { protect, restrictTo } from "../middlewares/guard.js";
import { ROLES } from "../utils/constants.js";
import { upload, uploadMultiple } from "../utils/imageUploader.js";
import * as controller from "../controllers/userController.js";
import {
  setCoverAndPhotos,
  uploadCacCert,
  uploadCoverImage,
  uploadDealershipLicense,
} from "../middlewares/x.js";

const router = express.Router({ mergeParams: true });
const { USER, ADMIN } = ROLES;

router.use(protect);

router.post(
  "/apply",
  restrictTo(USER),
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "cacCertificate", maxCount: 1 },
    { name: "dealershipLicence", maxCount: 1 },
    { name: "photos", maxCount: 10 },
  ]),
  uploadCacCert,
  uploadDealershipLicense,
  uploadCoverImage,
  uploadMultiple,
  controller.applyForDealership,
);

router.get("/me", controller.getMe);
router.patch("/update/me", upload.single("photo"), controller.updateMe);
router.patch("/delete/me", controller.deleteMe);

router.patch("/update-password", controller.updateMyPassword);

router.use(restrictTo(ADMIN));

router
  .route("/")
  .post(controller.createUser)
  .get(controller.getAllUsers)
  .delete(controller.deleteManyUsers);
router
  .route("/:id")
  .get(controller.getUser)
  .delete(controller.deleteUser)
  .patch(controller.updateUser);

router.patch("/approve/:id", controller.approveDealership);
router.patch("/reject/:id", controller.rejectDealership);
router.patch("/revoke/:id", controller.revokeDealership);

export default router;
