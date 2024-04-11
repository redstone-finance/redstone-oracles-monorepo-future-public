import consola, { FancyReporter, JSONReporter } from "consola";
import { z } from "zod";
import { getFromEnv } from "../common/env";
import { isNodeRuntime } from "../common/runtime";

const DEFAULT_ENABLE_JSON_LOGS = true;

export const loggerFactory = (moduleName: string) => {
  if (isNodeRuntime()) {
    const enableJsonLogs = getFromEnv(
      "ENABLE_JSON_LOGS",
      z.boolean().default(DEFAULT_ENABLE_JSON_LOGS)
    );
    const mainReporter = enableJsonLogs
      ? new JSONReporter()
      : new FancyReporter();

    return consola
      .create({
        reporters: [mainReporter],
      })
      .withTag(moduleName);
  } else {
    return console;
  }
};
