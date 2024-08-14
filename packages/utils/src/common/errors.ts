import axios, { AxiosError } from "axios";
import { LogLevel } from "consola";
import { getLogLevel, loggerFactory } from "../logger";

export function assert(value: unknown, errMsg: string): asserts value {
  if (!value) {
    throw new Error(`Assertion failed: ${errMsg}`);
  }
}

export function assertThenReturn<T>(value: T | undefined, errMsg: string): T {
  if (!value) {
    throw new Error(`Assertion failed: ${errMsg}`);
  }
  return value;
}

export function assertThenReturnOrFail<T>(
  value: T,
  errors: Error[],
  errMsg: string,
  failOnError: boolean
): T {
  if (errors.length > 0) {
    const error = new AggregateError(errors, errMsg);
    if (failOnError) {
      throw error;
    } else {
      assertWithLog(false, stringifyError(error));
    }
  }

  return value;
}

export const assertWithLog = (condition: boolean, errMsg: string) => {
  const logger = loggerFactory("utils/errors");

  if (!condition) {
    logger.error(`Assertion failed: ${errMsg}`);
  }
};

const STACK_LENGTH = 200;

let debug: boolean | undefined;

const stringifyStack = (stack: string | undefined): string => {
  if (!stack) {
    return "";
  }
  debug ??= getLogLevel() >= LogLevel.Debug;

  if (debug) {
    return stack;
  }
  const suffix = stack.length > STACK_LENGTH ? "..." : "";
  return stack.substring(0, STACK_LENGTH - suffix.length) + suffix;
};

export function stringifyError(e: unknown): string {
  const error = e as
    | AggregateError
    | AxiosError
    | undefined
    | Error
    | { toJSON: () => string };

  if (error === undefined) {
    return "undefined";
  } else if (error instanceof AggregateError) {
    const errorMessages: string[] = error.errors.map(stringifyError);
    return `AggregateError: ${error.message ? error.message : "<no message>"}, errors: ${errorMessages.join(
      "; "
    )}`;
  } else if (axios.isAxiosError<unknown>(error)) {
    const urlAsString = `url: ${JSON.stringify(error.config?.url)}`;
    const dataAsString = `data: ${JSON.stringify(error.response?.data)}`;
    return `${urlAsString}, ${dataAsString}, ` + stringifyStack(error.stack);
  } else if (error instanceof Error) {
    return stringifyStack(error.stack);
  } else if (typeof error.toJSON === "function") {
    return JSON.stringify(error.toJSON());
  } else {
    return `Error couldn't be handled by the stringifyError function: ${String(
      e
    )}`;
  }
}

export function simplifyErrorMessage(error: unknown) {
  if (error instanceof AggregateError) {
    const errorMessages: Set<string> = new Set();
    for (const err of error.errors) {
      const errorString = String(err);

      const pattern = "Original error: AggregateError: <no message>, errors:";
      const patternPos = errorString.indexOf(pattern);
      const startIndex = patternPos !== -1 ? patternPos + pattern.length : 0;
      const endIndex = errorString.indexOf("\n", startIndex);
      const shortenedError = errorString.substring(startIndex, endIndex).trim();

      errorMessages.add(shortenedError);
    }
    return Array.from(errorMessages).join("\n");
  } else {
    return stringifyError(error);
  }
}
