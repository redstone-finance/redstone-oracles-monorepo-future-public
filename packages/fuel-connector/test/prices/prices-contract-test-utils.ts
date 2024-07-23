import {
  IContractConnector,
  IPricesContractAdapter,
} from "@redstone-finance/sdk";
import { Provider, Wallet } from "fuels";
import {
  FuelPricesContractConnector,
  FuelPricesContractDeployer,
  PricesContractDeployParameters,
} from "../../src";
import { LOCAL_NODE_URL } from "../common/provider";
import "../common/set-test-envs";
import { GasUsageFuelPricesContractConnector } from "./GasUsageFuelPricesContractConnector";

export const SAMPLE_PACKAGES_TIMESTAMP = 1721130810;
export const SAMPLE_PACKAGES_TIMESTAMP_NEWER = 1721131310;

export const connectPricesContract = async (
  contractId: string,
  forGasUsageOnly: boolean = false,
  provider?: Provider
): Promise<IContractConnector<IPricesContractAdapter>> => {
  if (contractId && !!process.env.PRIVATE_KEY) {
    const wallet = Wallet.fromPrivateKey(
      process.env.PRIVATE_KEY,
      provider ?? (await Provider.create(LOCAL_NODE_URL))
    );

    return new (
      forGasUsageOnly
        ? GasUsageFuelPricesContractConnector
        : FuelPricesContractConnector
    )(wallet, contractId);
  }

  throw new Error(
    "Non-empty contractId and process.env.PRIVATE_KEY must be defined!"
  );
};

export const deployPricesContract = async (
  provider?: Provider,
  parameters?: PricesContractDeployParameters
): Promise<IPricesContractAdapter> => {
  if (process.env.PRIVATE_KEY) {
    const wallet = Wallet.fromPrivateKey(
      process.env.PRIVATE_KEY,
      provider ?? (await Provider.create(LOCAL_NODE_URL))
    );

    return await new FuelPricesContractDeployer(
      wallet,
      parameters ?? {
        fakeTimestamp: SAMPLE_PACKAGES_TIMESTAMP_NEWER - 60,
        signerCountThreshold: 2,
        signers: [
          "0x1ea62d73edf8ac05dfcea1a34b9796e937a29eff",
          "0x12470f7aba85c8b81d63137dd5925d6ee114952b",
          "0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB",
          "0x2c59617248994D12816EE1Fa77CE0a64eEB456BF",
          "0x83cba8c619fb629b81a65c2e67fe15cf3e3c9747",
        ],
      }
    ).getAdapter();
  }

  throw new Error("Non-empty PRIVATE_KEY must be defined!");
};
