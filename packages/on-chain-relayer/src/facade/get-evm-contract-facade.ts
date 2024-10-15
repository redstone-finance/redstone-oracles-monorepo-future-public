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
import { PriceAdapterEvmContractFacade } from "./PriceAdapterEvmContractFacade";

export const getEvmContractFacade = (relayerConfig: RelayerConfig) => {
  const { privateKey, adapterContractAddress } = config();
  const provider = getRelayerProvider();
  const signer = new Wallet(privateKey, provider);
  const abi = getAbiForAdapter();
  const adapterContract = new Contract(adapterContractAddress, abi, signer) as
    | RedstoneAdapterBase
    | MultiFeedAdapterWithoutRounds;

  return relayerConfig.adapterContractType === "multi-feed"
    ? new MultiFeedEvmContractFacade(
        adapterContract as MultiFeedAdapterWithoutRounds,
        (args) => updatePrices(args, adapterContract)
      )
    : new PriceAdapterEvmContractFacade(
        adapterContract as RedstoneAdapterBase,
        (args) => updatePrices(args, adapterContract)
      );
};
