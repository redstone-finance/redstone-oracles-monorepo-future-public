import { FuelPricesContractConnector } from "@redstone-finance/fuel-connector";
import { Provider, Wallet } from "fuels";
import { config } from "../config";

export const getFuelContractConnector = async () => {
  const { privateKey, adapterContractAddress, rpcUrls, gasLimit } = config();

  if (rpcUrls.length !== 1) {
    throw new Error("Only single rpc url is supported");
  }

  const wallet = Wallet.fromPrivateKey(
    privateKey,
    await Provider.create(rpcUrls[0])
  );

  return new FuelPricesContractConnector(
    wallet,
    adapterContractAddress,
    gasLimit
  );
};
