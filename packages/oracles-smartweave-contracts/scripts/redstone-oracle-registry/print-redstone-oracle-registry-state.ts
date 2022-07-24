import redstoneSDK from "redstone-sdk";
import niceLogger from "../nice-logger";

export const printRedstoneOracleRegistryState = async () => {
  const state = await redstoneSDK.getOracleRegistryState();
  niceLogger.log(state);
};
