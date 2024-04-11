import axios, { AxiosError } from "axios";
import { z } from "zod";
import { loggerFactory } from "../logger";
import { getFromEnv } from "./env";

const logger = loggerFactory("utils/errors");

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

export const assertWithLog = (condition: boolean, errMsg: string) => {
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
  debug ??= getFromEnv("DEBUG", z.boolean().default(false));

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
    return `AggregateError: ${error.message}, errors: ${errorMessages.join(
      "; "
    )}`;
  } else if (axios.isAxiosError(error)) {
    return JSON.stringify(error.response?.data) + stringifyStack(error.stack);
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
