import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import AppError from "./appError.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});
const maxSize = 2 * 1000 * 1000;
const filetype = (file) => {
  file.mimetype.toString();
};

const storage = multer.memoryStorage({
  filename: (req, file, cb) => {
    cb(file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    filetype === "image/png" ||
    filetype === "image/jpg" ||
    filetype === "image/jpeg" ||
    filetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new AppError("File type not allowed", 400), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: maxSize },
});

const uploadMultiple = async (req, res, next) => {
  console.log(req.files);

  try {
    const images = req.files.photos;

    if (!images) {
      return next(new AppError("No images to upload", 400));
    }

    const photos = [];

    for (const image of images) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "auto-lease",
            resource_type: "image",
            transformation: [
              { width: 1000, crop: "scale" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ],
            use_filename: true,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );
        uploadStream.end(image.buffer);
      });

      photos.push({ uri: result.secure_url, id: result.public_id });
    }

    req.body.photos = photos;

    console.log(photos);
    next();
  } catch (error) {
    console.log(error);

    next(new AppError("An error occurred while uploading files", 500));
  }
};

const cloudinaryImageUploader = async (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        transformation: [
          { width: 1000, crop: "scale" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
        folder: "auto-lease",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );
    uploadStream.end(buffer);
  });
};

const cloudinaryImageUpdater = async (buffer, previousImageId) => {
  try {
    await cloudinary.uploader.destroy(previousImageId, {
      folder: "auto-lease",
      resource_type: "image",
    });

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "auto-lease",
          transformation: [
            { width: 1000, crop: "scale" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );
      uploadStream.end(buffer);
    });
  } catch (error) {
    throw error;
  }
};

// Transforms images
// const cloudinaryImageRetriever = async (public_id,{transform})

export {
  upload,
  cloudinary,
  cloudinaryImageUploader,
  cloudinaryImageUpdater,
  uploadMultiple,
};
