import axios, { AxiosError } from "axios";

export const assert = (condition: boolean, errMsg?: string) => {
  if (!condition) {
    const errText = `Assertion failed: ` + (errMsg ? `: ${errMsg}` : "");
    throw new Error(errText);
  }
};

export const assertWithLog = (condition: boolean, errMsg?: string) => {
  if (!condition) {
    const errText = `Assertion failed: ` + (errMsg ? `: ${errMsg}` : "");
    console.error(errText);
  }
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
    return `Aggregate error messages: ${errorMessages.join("; ")}`;
  } else if (axios.isAxiosError(error)) {
    return JSON.stringify(error.response?.data) + " | " + error.stack;
  } else if (error instanceof Error) {
    return error.stack || String(error);
  } else if (typeof error.toJSON === "function") {
    return JSON.stringify(error.toJSON());
  } else {
    return `error can't be handle by stringifyError function ${String(e)}`;
  }
}
