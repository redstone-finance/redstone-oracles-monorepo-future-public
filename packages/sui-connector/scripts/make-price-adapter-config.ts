import {
  DataServiceIds,
  getSignersForDataServiceId,
} from "@redstone-finance/oracles-smartweave-contracts";
import { RedstoneCommon } from "@redstone-finance/utils";
import { PriceAdapterConfig } from "../src/PriceAdapterConfig";
import { DEFAULT_GAS_BUDGET } from "../src/SuiContractAdapter";

export function makeSuiDeployConfig(
  dataServiceId: DataServiceIds = "redstone-primary-prod"
): PriceAdapterConfig {
  return {
    signerCountThreshold: 3,
    maxTimestampDelayMs: RedstoneCommon.minToMs(15),
    maxTimestampAheadMs: RedstoneCommon.minToMs(3),
    signers: getSignersForDataServiceId(dataServiceId)!,
    trustedUpdaters: [], // no one is trusted at the start
    minIntervalBetweenUpdatesMs: 40 * 1000, // 40 secs between updated
    initializeTxGasBudget: DEFAULT_GAS_BUDGET,
  };
}
