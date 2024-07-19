import mongoose from "mongoose";
import slugify from "slugify";
import pointSchema from "./pointSchema.js";
import { photoSchema } from "./photoSchema.js";

export const dealershipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: [true, "This name is already in use"],
      trim: true,
      minlength: [4, "Dealership Name must be at least 4 characters long"],
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    cacCertificate: {
      type: String,
      select: false,
      required: [true, "A dealership must have a valid CAC certificate"],
    },
    dealershipLicence: {
      type: String,
      select: false,
      required: [
        true,
        "A dealership must have a valid valid Dealership Licence",
      ],
    },
    // description: {
    //   type: String,
    //   trim: true,
    //   required: [true, "Description is required"],
    //   maxlength: [500, "Description cannot be more than 500 characters"],
    //   minLength: [200, "Description cannot be less than 200 characters"],
    // },
    summary: {
      type: String,
      trim: true,
      required: [true, "Summary is required"],
      maxlength: [150, "Summary cannot be more than 150 characters"],
      minLength: [50, "Summary cannot be less than 50 characters"],
    },
    reputation: {
      type: Number,
      default: 0,
      max: [100, "A dealership reputation cannot be more than 100%"],
      min: [0, "A dealership reputation cannot be less than 0%"],
    },
    // startLocation: {
    //   type: pointSchema,
    //   required: [true, "Start location is required"],
    //   index: "2dsphere",
    // },
    coverImage: {
      type: photoSchema,
      required: ["A Dealership must have a cover image"],
    },
 photos: {
      type: [photoSchema],
      required: [true, "A car must have at least a photo"],
      validate: [
        limitArrayLength(10, 1),
        "Photos array must contain between 1 and 10 items",
      ],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A dealership must have an owner"],
    },
    deliveryAgent: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    isApproved: Boolean,
    // locations: [pointSchema],
    slug: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

dealershipSchema.virtual("cars", {
  ref: "Car",
  localField: "_id",
  foreignField: "dealership",
});

dealershipSchema.pre("save", function (next) {
  if (!this.isModified("slug")) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

dealershipSchema.pre(/^find/, async function (next) {
  if (!this.options.bypass) {
    this.find({ isApproved: true });
  }

  this.populate({
    path: "owner",
    select: "name photo _id",
  });

  this.populate({
    path: "cars",
    select: "name photos _id",
  });

  this.populate({
    path: "deliveryAgent",
    select: "name photo _id",
  });

  next();
});

const Dealership = mongoose.model("Dealership", dealershipSchema);

export default Dealership;
