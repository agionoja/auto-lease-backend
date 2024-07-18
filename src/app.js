// LIB IMPORT
import express from "express";
import bodyParser from "express";
import morgan from "morgan";
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
import carRouter from "./routes/carRouter.js";
import reviewRouter from "./routes/reviewRouter.js";
import { ensureValidObject } from "./middlewares/x.js";

const app = express();

//CRON JOBS
keepAwake();

app.use(cors());
app.use(helmet());
app.use(bodyParser.json({ limit: "10kb" }));
app.use(mongoSanitize());
app.use(xss());
app.use(morgan("dev"));

app.use(ensureValidObject); // this prevents mongoose from breaking when it receives a string instead of an object

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/dealerships", dealershipRouter);
app.use("/api/v1/cars", carRouter);
app.use("/api/v1/reviews", reviewRouter);

app.all("*", (req, res, next) => {
  return next(new AppError(`${req.originalUrl} is not on this server`, 404));
});

app.use(globalError);

export default app;
