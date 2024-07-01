// LIB IMPORT
import express from "express";
import bodyParser from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import xss from "xss-clean";

import mongoSanitize from "express-mongo-sanitize";
// PROJECT IMPORTS
import AppError from "./utils/appError.js";
import globalError from "./controllers/errorController.js";
import { keepAwake } from "./utils/croneJobs.js";
import userRouter from "./routes/userRouter.js";
import authRouter from "./routes/authRouter.js";
import dealershipRouter from "./routes/dealershipRouter.js";
import adminRouter from "./routes/adminRouter.js";
import carRouter from "./routes/carRouter.js";
import reviewRouter from "./routes/reviewRouter.js";

const app = express();

//CRON JOBS
keepAwake();

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: `To many request from this IP, please try again in an hour`,
});

app.use(helmet());
app.use("/api", limiter);
app.use(bodyParser.json({ limit: "10kb" }));
app.use(mongoSanitize());
app.use(xss());
app.use(morgan("dev"));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/dealership", dealershipRouter);
app.use("/api/v1/car", carRouter);
app.use("/api/v1/review", reviewRouter);

app.all("*", (req, res, next) => {
  return next(new AppError(`${req.originalUrl} is not on this server`, 404));
});

app.use(globalError);

export default app;
