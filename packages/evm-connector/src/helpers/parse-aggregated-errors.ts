export const parseAggregatedErrors = (error: AggregateError): string[] => {
  return error.errors.map((error: any) => {
    const errorStringified = JSON.stringify(error, null, 2);
    return errorStringified !== "{}" ? errorStringified : error.message;
  });
};
