import { Logger } from "@nestjs/common";
import { RedstoneCommon } from "@redstone-finance/utils";

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
      logger.error(
        `Failure: ${message}. ${RedstoneCommon.stringifyError(error)}`
      );
      throw error;
    });
}
