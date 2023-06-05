export const timeout = <T>(prom: Promise<T>, timeoutMS: number): Promise<T> => {
  let timer: NodeJS.Timeout;
  return Promise.race<T>([
    prom,
    new Promise(
      (_r, reject) =>
        (timer = setTimeout(
          () => reject(new Error(`Timeout error ${timeoutMS} [MS]`)),
          timeoutMS
        ))
    ),
  ]).finally(() => clearTimeout(timer));
};

export const sleepMS = (ms: number) =>
  new Promise((resolve, reject) => setTimeout(resolve, ms));
