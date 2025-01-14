import {
  makeSuiClient,
  makeSuiKeypair,
  SuiNetworkName,
  SuiPricesContractConnector,
} from "@redstone-finance/sui-connector";
import { RelayerConfig } from "../config/RelayerConfig";

export const getSuiContractConnector = (relayerConfig: RelayerConfig) => {
  const {
    privateKey,
    rpcUrls,
    adapterContractAddress,
    chainName,
    gasLimit,
    adapterContractPackageId,
  } = relayerConfig;
  const network = chainName as SuiNetworkName;

  if (rpcUrls.length !== 1) {
    throw new Error("Only single rpc url is supported");
  }

  if (!adapterContractPackageId) {
    throw new Error("adapterContractPackageId is required");
  }

  return new SuiPricesContractConnector(
    makeSuiClient(network, rpcUrls[0]),
    {
      network,
      packageId: adapterContractPackageId,
      priceAdapterObjectId: adapterContractAddress,
      writePricesTxGasBudget: gasLimit ? BigInt(gasLimit) : undefined,
    },
    makeSuiKeypair(privateKey)
  );
};
