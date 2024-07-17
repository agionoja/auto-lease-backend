import mongoose from "mongoose";
import chalk from "chalk";

const connectDb = async ({ localDb = true, maxRetries = 3 } = {}) => {
  const localDbUrl = process.env.DATABASE_LOCAL_URL;
  const onlineDbUrl = process.env.DATABASE_URL.replace(
    /<password>/g,
    process.env.DATABASE_PASSWORD,
  );

  const isOnline = process.env.NODE_ENV === "production" ? true : !localDb;
  let retries = 0;

  const connect = async (dbUrl) => {
    try {
      await mongoose.connect(dbUrl);
      console.log(
        chalk.greenBright(
          `Connected to ${isOnline ? "online" : "local"} database successfully.`,
        ),
      );
      return true;
    } catch (err) {
      console.log(
        chalk.red(
          `Failed to connect to ${isOnline ? "online" : "local"} database. Attempt ${retries + 1} of ${maxRetries}. Error: ${err.message}`,
        ),
      );
      return false;
    }
  };

  while (retries < maxRetries) {
    const dbUrl = isOnline ? onlineDbUrl : localDbUrl;
    const isConnected = await connect(dbUrl);
    if (isConnected) return;

    retries += 1;
  }

  // Fallback to local database if online database connection fails
  if (isOnline) {
    console.log(chalk.yellow("Falling back to local database connection."));
    retries = 0;
    while (retries < maxRetries) {
      const isConnected = await connect(localDbUrl);
      if (isConnected) return;

      retries += 1;
    }
  }

  console.log(
    chalk.red("Failed to connect to the database after multiple attempts."),
  );
};

export default connectDb;
