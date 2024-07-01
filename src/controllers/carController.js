import {catchAsync, filterObject} from "../utils/utils.js";
import Car from "../models/carModel.js";
import {cloudinary} from "../utils/imageUploader.js";
import AppError from "../utils/appError.js";
import AppQueries from "../utils/appQueries.js";
import {ROLES} from "../utils/constants.js";

const {ADMIN} = ROLES;

export const createCar = catchAsync(async (req, res, next) => {
    const car = await new Car({
        ...req.body
    });
    car.dealership = req.user._id
    const image = req.file.path

    const result = await cloudinary.uploader.upload(image )

    // Not too sure what I'm doing here
    car.coverImage = result.secure_url;
    car.coverImageId = result.public_id;

    if (!car) {
        return next(new AppError("Unable to create car", 400))
    }

    await car.save()

    res.status(201).json({
        status: "success",
        data: {
            car
        }
    })
});

export const getAllCarsV1 = catchAsync(async (req, res, next) => {
    let payload = []
    const appQueries = new AppQueries(req.query,
         Car.find()
        )
        .filter()
        .limitFields()
        .sort()
        .paginate()

    const cars = await appQueries.query

    if(req?.user?.role !== ADMIN){
        const length = cars.length;
        for (let i = 0;i<length; i++){
            payload.push(
                filterObject(cars[i],["vin","imei","platenumber"],{exclude:true})
            )
        }
    } else{
        payload = cars;
    }


    res.status(200).json({
        statustText: "Success",
        results:payload.length,
        data: {
        cars: payload
        }
    })

});

export const getCarV1 = (exposeSensitiveFields = false) =>
    catchAsync(async (req, res, next)=>{

    if(exposeSensitiveFields) {
        car = await Car.findById(req.params.id, {}, {lean:true})
            .select("+vin","+imei","+plateNumber")
            .exec();
    } else{
        car = await Car.findByid(
            req.params.id,
            {},
            {lean:true},
        ).exec();
    }

    if(!car){
        return next(new AppError("Car not found", 404))
    }

    res.status(200).json({
        statusText: "Success",
        data:{
            car
        }
    });
});

export const updateCarV1 = catchAsync(async(req,res,next)=>{
    let updates ={...req.body};


    if(req?.user?.role !== ADMIN){
        car = await Car.updateOne({ _id : req.params.id},{$set:{updates}})
            .select();
    } else {
        car = await Car.findByIdAndUpdate(req.params.id,{$set:{updates}})
    }

    if(!car)
    const car = await Car.findByIdAndUpdate(req.params.id,)
})

export const getCars = catchAsync(async (req, res, next) => {});
export const getCar = catchAsync(async (req, res, next) => {});
export const updateCar = catchAsync(async (req, res, next) => {});
export const deleteCar = catchAsync(async (req, res, next) => {});
