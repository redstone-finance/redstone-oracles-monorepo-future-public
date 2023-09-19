export const parseAggregatedErrors = (error: AggregateError): string[] => {
  return error.errors.map((error: unknown) => {
    const errorStringified = JSON.stringify(error, null, 2);
    return errorStringified !== "{}"
      ? errorStringified
      : (error as Error).message;
  });
};
