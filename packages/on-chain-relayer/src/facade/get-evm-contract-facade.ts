import { TxDeliveryManSupportedProviders } from "@redstone-finance/rpc-providers";
import { DataPackagesResponseCache } from "@redstone-finance/sdk";
import { Wallet } from "ethers";
import { RedstoneAdapterBase } from "../../typechain-types";
import { config } from "../config";
import { EvmContractConnector } from "../core/contract-interactions/EvmContractConnector";
import { getRelayerProvider } from "../core/contract-interactions/get-relayer-provider";
import { InfluxEvmContractAdapter } from "../core/contract-interactions/InfluxEvmContractAdapter";
import { OevPriceFeedsEvmContractAdapter } from "../core/contract-interactions/OevPriceFeedsEvmContractAdapter";
import { ITxDeliveryMan } from "../core/contract-interactions/tx-delivery-gelato-bypass";
import { getTxDeliveryMan } from "../core/TxDeliveryManSingleton";
import { RelayerConfig } from "../types";
import { EvmContractFacade } from "./EvmContractFacade";
import { getEvmContractAdapter } from "./get-evm-contract-adapter";
import { getIterationArgsProvider } from "./get-iteration-args-provider";

export const getEvmContractFacade = (
  relayerConfig: RelayerConfig,
  cache?: DataPackagesResponseCache
) => {
  const { privateKey } = config();
  const provider = getRelayerProvider();
  const signer = new Wallet(privateKey, provider);

  const txDeliveryMan = getTxDeliveryMan(
    signer,
    provider as TxDeliveryManSupportedProviders
  );

  const priceFeedsEvmContractAdapterOverride = relayerConfig.oevAuctionUrl
    ? (contract: RedstoneAdapterBase, txDeliveryMan?: ITxDeliveryMan) =>
        new OevPriceFeedsEvmContractAdapter<RedstoneAdapterBase>(
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
