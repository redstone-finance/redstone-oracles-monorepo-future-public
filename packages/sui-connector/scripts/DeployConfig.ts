import {
  DataServiceIds,
  getSignersForDataServiceId,
} from "@redstone-finance/oracles-smartweave-contracts";
import { RedstoneCommon } from "@redstone-finance/utils";
import { SuiNetworkName } from "../src";

export type SuiDeployConfig = {
  network: SuiNetworkName;
  signers: string[];
  signerCountThreshold: number;
  maxTimestampDelayMs: number;
  maxTimestampAheadMs: number;
  trustedUpdaters: string[];
  minIntervalBetweenUpdatesMs: number;
  initializeTxGasBudget: number;
};

export function makeSuiDeployConfig(
  network: SuiNetworkName,
  dataServiceId: DataServiceIds = "redstone-primary-prod"
): SuiDeployConfig {
  return {
    network,
    signerCountThreshold: 3,
    maxTimestampDelayMs: RedstoneCommon.minToMs(15),
    maxTimestampAheadMs: RedstoneCommon.minToMs(3),
    signers: getSignersForDataServiceId(dataServiceId)!,
    trustedUpdaters: [], // no one is trusted at the start
    minIntervalBetweenUpdatesMs: 40 * 1000, // 40 secs between updated
    initializeTxGasBudget: 100000000,
  };
}
