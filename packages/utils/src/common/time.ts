import { rejects } from "assert";
import { resolve } from "path";

export const timeout = <T>(
  prom: Promise<T>,
  timeoutMS: number,
  customErrorMessage?: string
): Promise<T> => {
  let timer: NodeJS.Timeout;
  return Promise.race<T>([
    prom,
    new Promise(
      (_r, reject) =>
        (timer = setTimeout(
          () =>
            reject(
              new Error(customErrorMessage ?? `Timeout error ${timeoutMS} [MS]`)
            ),
          timeoutMS
        ))
    ),
  ]).finally(() => clearTimeout(timer));
};

export const sleep = (ms: number) =>
  new Promise((resolve, rejects) => setTimeout(resolve, ms));
