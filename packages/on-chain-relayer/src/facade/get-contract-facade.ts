import {
  isMultiFeedAdapterType,
  isNonEvmConfig,
} from "@redstone-finance/on-chain-relayer-common";
import { DataPackagesResponseCache } from "@redstone-finance/sdk";
import { RelayerConfig } from "../config/RelayerConfig";
import { getNonEvmContractConnector } from "../non-evm/get-non-evm-contract-connector";
import { getEvmContractFacade } from "./get-evm-contract-facade";
import { getIterationArgsProvider } from "./get-iteration-args-provider";
import { MultiFeedNonEvmContractFacade } from "./MultiFeedNonEvmContractFacade";
import { NonEvmContractFacade } from "./NonEvmContractFacade";

export const getContractFacade = async (
  relayerConfig: RelayerConfig,
  cache?: DataPackagesResponseCache
) => {
  if (isNonEvmConfig(relayerConfig)) {
    return new (
      isMultiFeedAdapterType(relayerConfig.adapterContractType)
        ? MultiFeedNonEvmContractFacade
        : NonEvmContractFacade
    )(
      await getNonEvmContractConnector(relayerConfig),
      getIterationArgsProvider(relayerConfig),
      cache
    );
  }

  return getEvmContractFacade(relayerConfig, cache);
};
