import {
  makeSuiClient,
  makeSuiKeypair,
  SuiPricesContractConnector,
} from "@redstone-finance/sui-connector";
import { RelayerConfig } from "../config/RelayerConfig";

export const getSuiContractConnector = (relayerConfig: RelayerConfig) => {
  const {
    privateKey,
    rpcUrls,
    adapterContractAddress,
    chainId,
    gasLimit,
    adapterContractPackageId,
  } = relayerConfig;
  if (rpcUrls.length !== 1) {
    throw new Error("Only single rpc url is supported");
  }

  if (!adapterContractPackageId) {
    throw new Error("adapterContractPackageId is required");
  }

  return new SuiPricesContractConnector(
    makeSuiClient(chainId, rpcUrls[0]),
    {
      packageId: adapterContractPackageId,
      priceAdapterObjectId: adapterContractAddress,
      writePricesTxGasBudget: gasLimit ? BigInt(gasLimit) : undefined,
    },
    makeSuiKeypair(privateKey)
  );
};
