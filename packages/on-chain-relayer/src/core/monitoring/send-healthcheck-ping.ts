import axios, { AxiosError } from "axios";
import { config } from "../../config";

export const sendHealthcheckPing = async () => {
  const { healthcheckPingUrl } = config();
  if (healthcheckPingUrl) {
    try {
      await axios.get(healthcheckPingUrl);
    } catch (e) {
      const error = e as AxiosError;
      if (error.code === "ENOTFOUND") {
        console.error(
          "Healthcheck address not found. Configure your `HEALTHCHECK_PING_URL` properly",
        );
      } else {
        console.error(
          `Unknown error occurred, when trying to health check ping code: ${error.code} message: ${error.message}`,
        );
      }
    }
  }
};
