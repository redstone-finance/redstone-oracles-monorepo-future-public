import axios, { AxiosError } from "axios";

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
    console.error(`Assertion failed: ${errMsg}`);
  }
};

const stringifyStack = (stack: string | undefined): string => {
  if (!stack) {
    return "";
  }
  return stack;
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
