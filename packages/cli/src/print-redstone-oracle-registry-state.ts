import * as redstoneSDK from "@redstone-finance/sdk";
import niceLogger from "./utils/nice-logger";

export const printRedstoneOracleRegistryState = async () => {
  const state = await redstoneSDK.getOracleRegistryState();
  niceLogger.log(state);
};
