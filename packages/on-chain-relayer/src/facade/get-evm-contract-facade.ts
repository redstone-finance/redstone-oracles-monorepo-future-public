import { DataPackagesResponseCache } from "@redstone-finance/sdk";
import { Contract, Wallet } from "ethers";
import {
  MultiFeedAdapterWithoutRounds,
  RedstoneAdapterBase,
} from "../../typechain-types";
import { config } from "../config";
import { getAbiForAdapter } from "../core/contract-interactions/get-abi-for-adapter";
import { getRelayerProvider } from "../core/contract-interactions/get-relayer-provider";
import { updatePrices } from "../core/contract-interactions/update-prices";
import { RelayerConfig } from "../types";
import { MultiFeedEvmContractFacade } from "./MultiFeedEvmContractFacade";
import { MultiFeedInfluxContractFacade } from "./MultiFeedInfluxContractFacade";
import { PriceAdapterEvmContractFacade } from "./PriceAdapterEvmContractFacade";

export const getEvmContractFacade = (
  relayerConfig: RelayerConfig,
  cache?: DataPackagesResponseCache
) => {
  const { privateKey, adapterContractAddress } = config();
  const provider = getRelayerProvider();
  const signer = new Wallet(privateKey, provider);
  const abi = getAbiForAdapter();
  const adapterContract = new Contract(adapterContractAddress, abi, signer) as
    | RedstoneAdapterBase
    | MultiFeedAdapterWithoutRounds;

  if (relayerConfig.adapterContractType === "multi-feed") {
    return relayerConfig.dryRunWithInflux
      ? new MultiFeedInfluxContractFacade(
          adapterContract as MultiFeedAdapterWithoutRounds,
          relayerConfig,
          cache
        )
      : new MultiFeedEvmContractFacade(
          adapterContract as MultiFeedAdapterWithoutRounds,
          (args) => updatePrices(args, adapterContract),
          cache
        );
  }

  return new PriceAdapterEvmContractFacade(
    adapterContract as RedstoneAdapterBase,
    (args) => updatePrices(args, adapterContract),
    cache
  );
};
