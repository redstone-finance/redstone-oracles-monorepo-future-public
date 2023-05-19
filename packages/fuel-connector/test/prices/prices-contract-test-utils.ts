import { Provider } from "@fuel-ts/providers";
import { IPricesContractAdapter } from "redstone-sdk";
import { Wallet } from "@fuel-ts/wallet";
import { NativeAssetId } from "fuels";
import { GasUsageFuelPricesContractConnector } from "./GasUsageFuelPricesContractConnector";
import { generateTestWallet } from "../common/test-utils";
import {
  FuelPricesContractConnector,
  FuelPricesContractDeployer,
} from "../../src";

export const SAMPLE_PACKAGES_TIMESTAMP = 1678113540;
export const connectPricesContract = async (
  provider?: string | Provider,
  forGasUsageOnly: boolean = false
): Promise<IPricesContractAdapter> => {
  if (!!process.env.CONTRACT_ID && process.env.GENESIS_SECRET) {
    const wallet = Wallet.fromPrivateKey(process.env.GENESIS_SECRET, provider);

    return new (forGasUsageOnly
      ? GasUsageFuelPricesContractConnector
      : FuelPricesContractConnector)(
      wallet,
      process.env.CONTRACT_ID
    ).getAdapter();
  }

  throw "Non-empty CONTRACT_ID and GENESIS_SECRET must be defined!";
};

export const deployPricesContract = async (
  provider?: Provider
): Promise<IPricesContractAdapter> => {
  const wallet = await generateTestWallet(provider, [[1_000, NativeAssetId]]);

  return new FuelPricesContractDeployer(wallet, {
    fakeTimestamp: SAMPLE_PACKAGES_TIMESTAMP + 60,
    signerCountThreshold: 2,
    signers: [
      "0x1ea62d73edf8ac05dfcea1a34b9796e937a29eff",
      "0x12470f7aba85c8b81d63137dd5925d6ee114952b",
    ],
  }).getAdapter();
};
