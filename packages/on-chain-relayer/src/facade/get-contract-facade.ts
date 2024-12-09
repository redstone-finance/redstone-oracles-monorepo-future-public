import {
  AdapterType,
  NonEvmAdapterTypesEnum,
} from "@redstone-finance/on-chain-relayer-common";
import { DataPackagesResponseCache } from "@redstone-finance/sdk";
import { RelayerConfig } from "../config/RelayerConfig";
import { getNonEvmContractConnector } from "../non-evm/get-non-evm-contract-connector";
import { getEvmContractFacade } from "./get-evm-contract-facade";
import { getIterationArgsProvider } from "./get-iteration-args-provider";
import { NonEvmContractFacade } from "./NonEvmContractFacade";

export const getContractFacade = async (
  relayerConfig: RelayerConfig,
  cache?: DataPackagesResponseCache
) => {
  if (isNonEvmAdapterType(relayerConfig.adapterContractType)) {
    return new NonEvmContractFacade(
      await getNonEvmContractConnector(relayerConfig),
      getIterationArgsProvider(relayerConfig),
      cache
    );
  }

  return getEvmContractFacade(relayerConfig, cache);
};

export function isNonEvmAdapterType(value: AdapterType) {
  return NonEvmAdapterTypesEnum.safeParse(value).success;
}
