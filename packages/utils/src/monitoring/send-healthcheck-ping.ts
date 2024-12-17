import axios, { AxiosError } from "axios";
import { loggerFactory } from "../logger";

const logger = loggerFactory("healthcheck");

export const sendHealthcheckPing = async (healthcheckPingUrl?: string) => {
  if (!healthcheckPingUrl) {
    return;
  }
  const start = Date.now();
  try {
    await axios.get(healthcheckPingUrl);
    logger.info(`Sent healthcheck ping in ${Date.now() - start}ms`);
  } catch (e) {
    const error = e as AxiosError;
    if (error.code === "ENOTFOUND") {
      logger.error(
        "Healthcheck address not found. Configure your `HEALTHCHECK_PING_URL` properly"
      );
    } else {
      logger.error(
        "Unknown error occurred, when trying to health check ping",
        error
      );
    }
  }
};
