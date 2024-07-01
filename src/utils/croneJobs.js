import cron from "node-cron";
import chalk from "chalk";

export const keepAwake = () =>
  cron.schedule("10 * * * *", async () => {
    try {
      const response = await fetch(
        `https://auto-lease.onrender.com/api/v1/auth/sign-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: process.env.CRONE_USER_EMAIL,
            password: process.env.CRONE_USER_PASSWORD + 1,
          }),
        },
      );

      if (!response.ok) {
        const errRes = await response.json();
        return console.error(
          chalk.red(
            `HTTP error! status: ${errRes.status}, ${errRes.statusText}`,
          ),
        );
      }

      const data = await response.json();
      console.log(
        chalk.blueBright(
          `${data.data.user.name} is keeping online server awake`,
        ),
      );
    } catch (err) {
      console.log();
    }
  });
