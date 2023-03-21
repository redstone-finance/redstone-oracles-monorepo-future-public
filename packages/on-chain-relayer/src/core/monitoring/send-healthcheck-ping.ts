import axios from "axios";
import { config } from "../../config";

export const sendHealthcheckPing = async () => {
  const { healthcheckPingUrl } = config;
  if (healthcheckPingUrl) {
    await axios.get(healthcheckPingUrl);
  }
};
