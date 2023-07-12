import axios from "axios";
import { config } from "../../config";

export const sendHealthcheckPing = async () => {
  const { healthcheckPingUrl } = config();
  if (healthcheckPingUrl) {
    try {
      await axios.get(healthcheckPingUrl);
    } catch (error: any) {
      if (error.code === "ENOTFOUND") {
        console.error(
          "Healthcheck address not found. Configure your `HEALTHCHECK_PING_URL` properly"
        );
      } else {
        throw error;
      }
    }
  }
};
