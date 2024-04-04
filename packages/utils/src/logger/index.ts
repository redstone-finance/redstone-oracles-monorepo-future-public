import consola, { FancyReporter, JSONReporter } from "consola";
import { z } from "zod";
import { getFromEnv } from "../common";

const DEFAULT_ENABLE_JSON_LOGS = true;

export default (moduleName: string) => {
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
};
