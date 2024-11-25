import { TxDeliveryManSupportedProviders } from "@redstone-finance/rpc-providers";
import { DataPackagesResponseCache } from "@redstone-finance/sdk";
import { Wallet } from "ethers";
import { RedstoneAdapterBase } from "../../typechain-types";
import { RelayerConfig } from "../config/RelayerConfig";
import { EvmContractConnector } from "../core/contract-interactions/EvmContractConnector";
import { getRelayerProvider } from "../core/contract-interactions/get-relayer-provider";
import { InfluxEvmContractAdapter } from "../core/contract-interactions/InfluxEvmContractAdapter";
import { OevPriceFeedsEvmContractAdapter } from "../core/contract-interactions/OevPriceFeedsEvmContractAdapter";
import { ITxDeliveryMan } from "../core/contract-interactions/tx-delivery-gelato-bypass";
import { getTxDeliveryMan } from "../core/TxDeliveryManSingleton";
import { EvmContractFacade } from "./EvmContractFacade";
import { getEvmContractAdapter } from "./get-evm-contract-adapter";
import { getIterationArgsProvider } from "./get-iteration-args-provider";

export const getEvmContractFacade = (
  relayerConfig: RelayerConfig,
  cache?: DataPackagesResponseCache
) => {
  const { privateKey } = relayerConfig;
  const provider = getRelayerProvider(relayerConfig);
  const signer = new Wallet(privateKey, provider);

  const txDeliveryMan = getTxDeliveryMan(
    relayerConfig,
    signer,
    provider as TxDeliveryManSupportedProviders
  );

  const priceFeedsEvmContractAdapterOverride = relayerConfig.oevAuctionUrl
    ? (
        relayerConfig: RelayerConfig,
        contract: RedstoneAdapterBase,
        txDeliveryMan?: ITxDeliveryMan
      ) =>
        new OevPriceFeedsEvmContractAdapter<RedstoneAdapterBase>(
          relayerConfig,
          contract,
          txDeliveryMan
        )
    : undefined;

  let adapter = getEvmContractAdapter(
    relayerConfig,
    signer,
    txDeliveryMan,
    priceFeedsEvmContractAdapterOverride
  );

  if (relayerConfig.dryRunWithInflux) {
    adapter = new InfluxEvmContractAdapter(adapter, relayerConfig);
  }

  return new EvmContractFacade(
    new EvmContractConnector(provider, adapter),
    getIterationArgsProvider(relayerConfig),
    cache
  );
};
