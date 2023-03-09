import { config } from "../../config";
import { timeUpdateCondition } from "./time-condition";

export const shouldUpdate = (lastUpdateTimestamp: number) => {
  const { updateCondition } = config;
  switch (updateCondition) {
    case "time":
      return timeUpdateCondition(lastUpdateTimestamp);
    default:
      throw new Error("Invalid update condition");
  }
};
