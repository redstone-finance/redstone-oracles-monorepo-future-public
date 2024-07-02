import { Contract, Wallet } from "ethers";
import { MultiFeedAdapterWithoutRounds } from "../../../typechain-types";
import { config } from "../config";
import { getAbiForAdapter } from "./get-abi-for-adapter";
import { getRelayerProvider } from "./get-relayer-provider";

export const getAdapterContract = () => {
  const { privateKey, adapterContractAddress } = config();
  const abi = getAbiForAdapter();
  const provider = getRelayerProvider();
  const signer = new Wallet(privateKey, provider);
  return new Contract(
    adapterContractAddress,
    abi,
    signer
  ) as MultiFeedAdapterWithoutRounds;
};
