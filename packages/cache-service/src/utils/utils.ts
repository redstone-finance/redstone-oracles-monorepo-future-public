import { Logger } from "@nestjs/common";

// TODO: this should be in common package
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringifyError(e: any) {
  if (e === undefined) {
    return "undefined";
  } else if (e === null) {
    return "null";
  } else if (e.response) {
    return JSON.stringify(e.response.data) + " | " + e.stack;
  } else if (e.toJSON) {
    return JSON.stringify(e.toJSON());
  } else {
    return e.stack || String(e);
  }
}
/* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

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
