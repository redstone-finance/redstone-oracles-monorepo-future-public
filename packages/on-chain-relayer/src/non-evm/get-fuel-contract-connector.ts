import { FuelPricesContractConnector } from "@redstone-finance/fuel-connector";
import { RedstoneCommon } from "@redstone-finance/utils";
import { Provider, Wallet } from "fuels";
import { RelayerConfig } from "../types";

export const getFuelContractConnector = async (
  relayerConfig: RelayerConfig
) => {
  const { privateKey, adapterContractAddress, rpcUrls, gasLimit, chainId } =
    relayerConfig;

  if (rpcUrls.length !== 1) {
    throw new Error("Only single rpc url is supported");
  }

  const wallet = Wallet.fromPrivateKey(
    privateKey,
    await Provider.create(rpcUrls[0])
  );

  RedstoneCommon.assert(
    chainId === wallet.provider.getChainId(),
    `The chainId from manifest: ${chainId} is different than fetched from provider: ${wallet.provider.getChainId()}`
  );

  return new FuelPricesContractConnector(
    wallet,
    adapterContractAddress,
    gasLimit
  );
};
