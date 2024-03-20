import { ISafeNumber, SafeZero, calculateSum, getMedian } from ".";

export type WeightedValue = {
  value: ISafeNumber;
  weight: ISafeNumber;
};

export const getWeightedMedian = (
  weightedValues: WeightedValue[]
): ISafeNumber => {
  if (weightedValues.length === 0) {
    throw new Error("Cannot get weighted median value of an empty array");
  }

  const sortedValues: WeightedValue[] = [...weightedValues].sort((a, b) =>
    a.value.lt(b.value) ? -1 : 1
  );

  const halfTotalWeight = calculateSum(sortedValues.map((wv) => wv.weight)).div(
    2
  );

  let cumulativeWeight = SafeZero;
  for (let i = 0; i < sortedValues.length; i++) {
    const weightedValue = sortedValues[i];
    cumulativeWeight = cumulativeWeight.add(weightedValue.weight);
    if (cumulativeWeight.gt(halfTotalWeight)) {
      return weightedValue.value;
    } else if (cumulativeWeight.eq(halfTotalWeight)) {
      return weightedValue.value.add(sortedValues[i + 1].value).div(2);
    }
  }

  throw new Error(
    "This should not happen: the accumulated weight did not exceed half of the sum of the weights"
  );
};

export const logarithmicWeighting = (
  weightedValues: WeightedValue[]
): WeightedValue[] => {
  const medianWeight = getMedian(weightedValues.map((v) => v.weight));
  return weightedValues.map((weightedValue) => ({
    value: weightedValue.value,
    weight: weightedValue.weight.div(medianWeight).add(1).log2(),
  }));
};

export const normalizeWeightedValues = (
  weightedValues: WeightedValue[]
): WeightedValue[] => {
  const sum = calculateSum(weightedValues.map((value) => value.weight));
  return weightedValues.map((weightedValue) => ({
    value: weightedValue.value,
    weight: weightedValue.weight.div(sum),
  }));
};
