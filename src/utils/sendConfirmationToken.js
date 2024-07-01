import chalk from "chalk";
import Email from "./email.js";
import AppError from "./appError.js";
import { baseUrl, isProduction } from "./utils.js";
import {
  destroyUserConfirmationTokenAndSave,
  generateAndSaveUserConfirmationToken,
} from "./userHelper.js";

const sendConfirmationToken = async (
  req,
  res,
  next,
  user,
  statusCode = 200,
) => {
  const token = await generateAndSaveUserConfirmationToken(user);
  const url = `${baseUrl(req)}/auth/confirm-user/${token}`; // TODO: Construct this URL based on the frontend

  try {
    await new Email(user, url).sendConfirmation();

    // Handle unconfirmed user sign-in scenario
    if (statusCode === 401) {
      return next(
        new AppError(
          "User is not yet confirmed. A confirmation token has been sent to your email.",
          statusCode,
        ),
      );
    }

    // Send success response
    res.status(statusCode).json({
      statusText: "success",
      message:
        "Confirmation email sent! Please check your inbox to verify your account.",
      token: isProduction ? undefined : token,
    });
  } catch (err) {
    // Clean up token in case of email sending error
    await destroyUserConfirmationTokenAndSave(user);

    // Log the error for debugging
    console.error(chalk.red("Error sending confirmation email: ", err));

    // Handle user creation with email sending failure
    if (statusCode === 201) {
      return res.status(statusCode).json({
        statusText: "success",
        message: isProduction
          ? "Your account has been created successfully, but we couldn't send the confirmation email. Please request a new confirmation token."
          : `Your account has been created successfully, but there was an error sending the confirmation email: ${err.message}. Please request a new confirmation token.`,
      });
    }

    // Handle other errors
    return next(
      new AppError(
        isProduction
          ? "An error occurred while sending the confirmation email. Please try again later."
          : `Error sending confirmation email: ${err.message}`,
        500,
      ),
    );
  }
};

export default sendConfirmationToken;
