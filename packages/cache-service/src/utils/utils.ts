import { Logger } from "@nestjs/common";

// TODO: this should be in common package
export function stringifyError(e: any) {
  if (e === undefined) {
    return "undefined";
  } else if (e.response) {
    return JSON.stringify(e.response.data) + " | " + e.stack;
  } else if (e.toJSON) {
    return JSON.stringify(e.toJSON());
  } else {
    return e.stack || String(e);
  }
}

export function runPromiseWithLogging<T>(
  promise: Promise<T>,
  message: string,
  logger: Logger
): Promise<T> {
  return promise
    .then((result) => {
      logger.log(`Success: ${message}.`);
      return result;
    })
    .catch((error) => {
      logger.error(`Failure: ${message}. ${stringifyError(error)}`);
      throw error;
    });
}
