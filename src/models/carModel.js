import mongoose from "mongoose";
import slugify from "slugify";
import { limitArrayLength } from "../utils/utils.js";
import pointSchema from "./pointSchema.js";

const carSchema = new mongoose.Schema(
  {
      dealership :{
          type: mongoose.Schema.Types.ObjectId,
          ref: "Dealership",
          required: [true, "A car must have a dealership"],
      },
    name: {
      type: String,
      trim: true,
      required: [true, "A car must have a name"],
      minlength: [3, "A car name must be at least 3 characters long"],
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    model: {
      type: String,
      trim: true,
      required: [true, "A car must have a model"],
      minlength: [3, "A car name must be at least 3 characters long"],
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    vin: {
      type: String,
      trim: true,
      required: [true, "A Vehicle Identification Number is required"],
      match: [/^[A-HJ-NPR-Z0-9]{17}$/, "Please enter a valid VIN"], // 17 characters for VIN
    },
    imei: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => /^\d{15}$/.test(v),
        message: (props) => `${props.value} is not a valid IMEI!`,
      },
      required: [true, "A IMEI is required"],
      match: [/^\d{15}$/, "Please enter a valid IMEI"], // 15 digits for IMEI
    },
    plateNumber: {
      type: String,
      trim: true,
      required: [true, "Plate Number is required"],
      match: [
        /^[A-Z]{3}-?\d{3}[A-Z]{2}$/,
        "Please enter a valid Nigerian plate number",
      ],
    },
    description: {
      type: String,
      trim: true,
      // required: [true, "Description is required"],
      maxlength: [500, "Description cannot be more than 500 characters"],
      minLength: [200, "Description cannot be less than 200 characters"],
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "Summary is required"],
      maxlength: [150, "Summary cannot be more than 150 characters"],
      minLength: [50, "Summary cannot be less than 50 characters"],
    },
    slug: String,
    duration: {
      type: Date,
      required: [true, "A car must have a lease duration"],
    },
    coverImage:{
          type: String,
        required: true
    },
    coverImageId :{
          type: String,
        required:true
    },
    photos: {
      type: [String],
      required: [true, "A car must have at least a photo"],
      validate: [
        limitArrayLength(10, 1),
        "Photos array must contain between 1 and 10 items",
      ],
    },
      photosId:{
        type: [String],
        required:[true,"A car photo must have an id"]
      },
    price: {
      type: Number,
      required: [true, "A car must have a price"],
      min: [0, "Price cannot be negative"],
    },
    fee: {
      type: Number,
      required: [true, "A car must have a lease fee"],
      validate: {
        //TODO: confirm the min and max price fee
        validator: function (value) {
          const price =
            this.price !== undefined ? this.price : this.get("price");
          return price > value;
        },
        message: "Fee must be less than the price",
      },
    },
    discount: {
      type: Number,
      validate: {
        validator: (v) => v >= 0 && v <= 100,
        message: "Discount must be between 0% to 100%",
      },
    },
    locations: {
      type: [pointSchema],
      required: [true, "A car must have a location"],
      validate: [
        limitArrayLength(5, 1),
        "Location array must contain between 1 and 5 items",
      ],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

carSchema.pre("save", function (next) {
  if (!this.isModified("slug")) {
    this.name = slugify(this.name, { lower: true });
  }
  next();
});

const Car = mongoose.model("Car", carSchema);

export default Car;
