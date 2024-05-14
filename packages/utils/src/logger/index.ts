import consola, {
  Consola,
  FancyReporter,
  JSONReporter,
  LogLevel,
} from "consola";
import { z } from "zod";
import { getFromEnv } from "../common/env";
import { isNodeRuntime } from "../common/runtime";

const DEFAULT_ENABLE_JSON_LOGS = true;
const DEFAULT_LOG_LEVEL = LogLevel.Info;

export type RedstoneLogger = Consola | Console;

export const loggerFactory = (moduleName: string): RedstoneLogger => {
  if (isNodeRuntime()) {
    const enableJsonLogs = getFromEnv(
      "REDSTONE_FINANCE_ENABLE_JSON_LOGS",
      z.boolean().default(DEFAULT_ENABLE_JSON_LOGS)
    );
    const mainReporter = enableJsonLogs
      ? new JSONReporter()
      : new FancyReporter();

    return consola
      .create({
        reporters: [mainReporter],
        level: getLogLevel(),
      })
      .withTag(moduleName);
  } else {
    return console;
  }
};

export const getLogLevel = () => {
  return getFromEnv(
    "REDSTONE_FINANCE_LOG_LEVEL",
    z.nativeEnum(LogLevel).default(DEFAULT_LOG_LEVEL)
  );
};
