import { Contract, Wallet } from "ethers";
import {
  MultiFeedAdapterWithoutRounds,
  RedstoneAdapterBase,
} from "../../../typechain-types";
import { config } from "../../config";
import { getAbiForAdapter } from "./get-abi-for-adapter";
import { getRelayerProvider } from "./get-relayer-provider";

export const getAdapterContract = () => {
  const { privateKey, adapterContractAddress } = config();
  const provider = getRelayerProvider();
  const signer = new Wallet(privateKey, provider);
  const abi = getAbiForAdapter();
  return new Contract(adapterContractAddress, abi, signer) as
    | RedstoneAdapterBase
    | MultiFeedAdapterWithoutRounds;
};
