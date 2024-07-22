import { catchAsync } from "../utils/helpers.js";
import {
  cloudinaryImageUpdater,
  cloudinaryImageUploader,
  upload,
} from "../utils/imageUploader.js";
import AppError from "../utils/appError.js";

export const uploadCoverImage = catchAsync(async (req, res, next) => {
  const coverImage = req?.files?.coverImage;

  if (!coverImage) {
    return next();
  }

  const result = await cloudinaryImageUploader(coverImage[0].buffer);

  req.body.coverImage = {
    url: result.secure_url,
    id: result.public_id,
  };
  next();
});

export const uploadDealershipLicense = catchAsync(async (req, res, next) => {
  const dealershipLicense = req?.files?.coverImage;

  if (!dealershipLicense) {
    return next();
  }

  const result = await cloudinaryImageUploader(dealershipLicense[0].buffer);

  req.body.dealershipLicense = {
    url: result.secure_url,
    id: result.public_id,
  };

  next();
});

export const uploadCacCert = catchAsync(async (req, res, next) => {
  const cacCert = req?.files?.cacCertificate;

  if (!cacCert) {
    return next();
  }

  const result = await cloudinaryImageUploader(cacCert[0].buffer);

  req.body.cacCertificate = {
    url: result.secure_url,
    id: result.public_id,
  };

  next();
});

export const setUpdateCoverImage = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id, { coverImage: 1 })
      .lean()
      .exec();

    if (!doc) {
      return next();
    }

    const coverImage = req?.files?.coverImage;

    if (!coverImage) {
      return next();
    }

    const result = await cloudinaryImageUpdater(
      coverImage.buffer,
      doc.coverImage.id,
    );

    req.body.coverImage = {
      url: result.secure_url,
      id: result.public_id,
    };
    next();
  });

export const setCoverAndPhotos = () =>
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "photos", maxCount: 10 },
  ]);

export const ensureValidObject = (req, res, next) => {
  const flags = ["photos", "locations"];
  const body = req.body;

  Object.keys(body).forEach((key) => {
    if (flags.includes(key)) {
      if (typeof body[key] !== "object") {
        body[key] = {};
      }
    }
  });

  next();
};
