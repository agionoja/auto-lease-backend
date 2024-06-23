process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log(chalk.red("UNCAUGHT EXCEPTION 🧨 Shutting down"));
  process.exit(1);
});

import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config();
import app from "./src/app.js";
import connectDb from "./src/utils/db.js";

const startServer = async () => {
  const port = process.env.PORT || 5000;
  await connectDb({ localDb: true });
  const server = app.listen(port, () => {
    console.log(
      chalk.greenBright(
        `Server is listening to requests on ${chalk.blueBright.underline(`http://127.0.0.1:${port}`)}`,
      ),
    );
  });

  process.on("unhandledRejection", (err) => {
    console.log(err.name, err.message);
    console.log(chalk.red(`UNHANDLED REJECTION 🧨 Shutting down`));
    server.close(() => {
      process.exit(1);
    });
  });
};

(async () => await startServer())();
