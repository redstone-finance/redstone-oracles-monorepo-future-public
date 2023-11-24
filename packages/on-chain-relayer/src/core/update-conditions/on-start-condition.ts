import { ConditionCheckResponse } from "../../types";

let isFirstIteration: boolean = false;

export const markFirstIteration = () => {
  isFirstIteration = true;
};

export const onStartCondition = (): ConditionCheckResponse => {
  const warningMessage = isFirstIteration
    ? "First iteration"
    : "Subsequent iteration";
  const result = { warningMessage, shouldUpdatePrices: isFirstIteration };

  isFirstIteration = false;

  return result;
};
