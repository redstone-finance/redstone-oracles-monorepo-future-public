import axios, { AxiosError } from "axios";

export const sendHealthcheckPing = async (healthcheckPingUrl?: string) => {
  if (healthcheckPingUrl) {
    try {
      await axios.get(healthcheckPingUrl);
    } catch (e) {
      const error = e as AxiosError;
      if (error.code === "ENOTFOUND") {
        console.error(
          "Healthcheck address not found. Configure your `HEALTHCHECK_PING_URL` properly"
        );
      } else {
        console.error(
          "Unknown error occurred, when trying to health check ping",
          error
        );
      }
    }
  }
};
