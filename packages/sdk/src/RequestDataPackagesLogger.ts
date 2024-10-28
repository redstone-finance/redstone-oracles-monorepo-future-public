import { loggerFactory } from "@redstone-finance/utils";
import {
  DataPackagesResponse,
  getResponseTimestamp,
} from "./request-data-packages";

export class RequestDataPackagesLogger {
  private readonly initialDate: number;
  private readonly particularResponses: (DataPackagesResponse | undefined)[];
  private readonly particularErrors: (Error | undefined)[];
  private readonly particularTimes: (number | undefined)[];

  constructor(
    requestsLength: number,
    protected readonly logger = loggerFactory("request-data-packages")
  ) {
    this.initialDate = Date.now();

    this.particularResponses = Array.from({ length: requestsLength });
    this.particularErrors = Array.from({ length: requestsLength });
    this.particularTimes = Array.from({ length: requestsLength });
  }

  private static filterOutUndefined<T>(array: (T | undefined)[]) {
    return array.filter((item) => item !== undefined);
  }

  didReceiveError(error: unknown, index: number) {
    this.particularErrors[index] = error as Error;
    this.particularTimes[index] = Date.now() - this.initialDate;
  }

  didReceiveResponse(response: DataPackagesResponse, index: number) {
    this.particularResponses[index] = response;
    this.particularTimes[index] = Date.now() - this.initialDate;
  }

  willCheckState(timeout: boolean, didResolveOrReject: boolean) {
    const collectedResponses = RequestDataPackagesLogger.filterOutUndefined(
      this.particularResponses
    );
    const particularTimestamps = this.particularTimestamps();
    const collectedErrors = RequestDataPackagesLogger.filterOutUndefined(
      this.particularErrors
    );

    (timeout ? this.logger.info : this.logger.debug)(
      `${timeout ? "Timed out with" : "Checking"} ${collectedResponses.length} response(s) / ${collectedErrors.length} errors ` +
        `, didResolveOrReject before: ${didResolveOrReject}`,
      {
        particularTimestamps,
        particularTimes: this.particularTimes,
        particularErrors: this.particularErrors.map((e) => e?.message),
        collectedResponsesLength: collectedResponses.length,
        collectedErrorsLength: collectedErrors.length,
      }
    );
  }

  willResolve(newestPackage: DataPackagesResponse) {
    const timestampDelta = Date.now() - getResponseTimestamp(newestPackage);
    const collectedResponses = RequestDataPackagesLogger.filterOutUndefined(
      this.particularResponses
    );
    const particularTimestamps = this.particularTimestamps();

    this.logger.log(
      `Resolving with the newest package timestamp: ${getResponseTimestamp(newestPackage)} of ${collectedResponses.length} responses` +
        `, ${timestampDelta / 1000} [s] ago`,
      {
        responseTimestamps: particularTimestamps,
        timestampDelta,
        collectedResponsesLength: collectedResponses.length,
        particularTimes: this.particularTimes,
      }
    );
  }

  willReject() {
    this.logger.error("Rejecting...", {
      particularErrors: this.particularErrors.map((e) => e?.message),
    });
  }

  feedIsMissing(message: string) {
    this.logger.info(message);
  }

  private particularTimestamps() {
    return this.particularResponses.map((response) =>
      response ? getResponseTimestamp(response) : undefined
    );
  }
}
