import {
  IterationArgsMessage,
  IterationLogger,
} from "@redstone-finance/on-chain-relayer";

export class GelatoLogger implements IterationLogger {
  // No matter how big the number of messages is - the total length must not exceed ~1000 bytes

  public readonly messages: IterationArgsMessage[] = [];

  getMainMessage() {
    return this.messages.at(0)?.message;
  }

  log(message: string, ...args: unknown[]): void {
    this.messages.push({ message, args });
  }

  private static REPLACE_PATTERNS = [
    ['"', ""],
    [" has passed to update prices: ", " "],
    [" to be updated. ", " "],
    ["Value has ", ""],
    ["not", "Not"],
    ["Time in fallback mode:", "FlMd"],
    ["Deviation in fallback mode:", "FlMd"],
    [" AND Historical", ",H"],
    ["deviated enough", "devEngh"],
    ["enough time", "enghTm"],
    ["update prices according to cron expr", "updCron"],
    ...[
      "dataFeedId",
      "timeDiff",
      "updatePriceInterval",
      "maxDeviation",
      "thresholdDeviation",
      "valueFromContract",
      "valuesFromNode",
      "timestamp",
      "timeSinceLastUpdate",
      "timeSinceLastExpectedUpdate",
      "timeToNextExpectedUpdate",
      "type",
    ].map((pattern) => [pattern, GelatoLogger.shortenKey(pattern)]),
  ];

  private static consoleLog(object: unknown) {
    const message =
      typeof object === "string" ? object : JSON.stringify(object);

    if (!message.length) {
      return;
    }

    console.log(GelatoLogger.compress(message));
  }

  private static compress(message: string) {
    return this.REPLACE_PATTERNS.reduce(
      (acc, [pattern, shortened]) => acc.replaceAll(pattern, shortened),
      message
    );
  }

  private static shortenKey(key: string) {
    const words = key.split(/(?=[A-Z])/g);
    const firstWord = words[0].substring(0, 3);
    return `${firstWord}${words
      .slice(1, -1)
      .map((word) => word[0])
      .join(
        ""
      )}${words.length > 1 ? words[words.length - 1].substring(0, 3) : ""}`;
  }

  emitMessages() {
    this.messages.forEach(({ message, args }, index) => {
      if (index > 0) {
        // only the first log is emitted with fully split args; the others are stringified
        return GelatoLogger.consoleLog(
          `${message}${args ? ` ${JSON.stringify(args)}` : ""}`
        );
      }

      GelatoLogger.consoleLog(message);
      args?.map((arg) => {
        if (Array.isArray(arg)) {
          return arg.forEach((a) => GelatoLogger.consoleLog(a));
        }

        GelatoLogger.consoleLog(arg);
      });
    });
  }
}
