const colors = {
  reset: "\x1b[0m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  info: "\x1b[34m",
  debug: "\x1b[37m",
};

const simpleLog =
  (level: keyof typeof colors) =>
  (...args: unknown[]) => {
    process.stdout.write(
      `${colors[level]}` + args.join(" ") + `${colors.reset}\n`
    );
  };

global.console = {
  ...global.console,
  log: simpleLog("reset"),
  warn: simpleLog("warn"),
  debug: simpleLog("debug"),
  error: simpleLog("error"),
  info: simpleLog("info"),
};
