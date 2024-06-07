import { consts } from "@redstone-finance/protocol";
import { testInBrowser } from "./test-in-browser";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
testInBrowser(
  "./test-browser-compatibility",
  consts.REDSTONE_MARKER_HEX.substring(2)
);
