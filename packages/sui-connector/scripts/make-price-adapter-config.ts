import {
  DataServiceIds,
  getSignersForDataServiceId,
} from "@redstone-finance/oracles-smartweave-contracts";
import { RedstoneCommon } from "@redstone-finance/utils";
import { DEFAULT_GAS_BUDGET, PriceAdapterConfig } from "../src";

export function makeSuiDeployConfig(
  dataServiceId: DataServiceIds = "redstone-primary-prod"
): PriceAdapterConfig {
  return {
    signerCountThreshold: 3,
    maxTimestampDelayMs: RedstoneCommon.minToMs(3),
    maxTimestampAheadMs: RedstoneCommon.minToMs(1),
    signers: getSignersForDataServiceId(dataServiceId)!,
    trustedUpdaters: [
      "0xbd288ccf0f92df315f7b212e5481f4f2b469f6c61c0d58a16e616eb2e0341f9c",
      "0xfcb82d9138f1aed43fd1259c94fe20890c2f48297dc673d354efd9f9572f0319",
      "0x3fdbf6ed9ce8f7684907fe9c06f6543bc3f9ef515e247db5e6df47d1954ee223",
    ],
    minIntervalBetweenUpdatesMs: 40 * 1000, // 40 secs between updated
    initializeTxGasBudget: DEFAULT_GAS_BUDGET,
  };
}
