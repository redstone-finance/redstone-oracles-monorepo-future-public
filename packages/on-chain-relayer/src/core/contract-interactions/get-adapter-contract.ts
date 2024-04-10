import { Contract, Wallet } from "ethers";
import { RedstoneAdapterBase } from "../../../typechain-types";
import { config } from "../../config";
import { getRelayerProvider } from "./get-relayer-provider";
import { getAbiForAdapter } from "./get-abi-for-adapter";

export const getAdapterContract = () => {
  const { privateKey, adapterContractAddress } = config();
  const provider = getRelayerProvider();
  const signer = new Wallet(privateKey, provider);
  const abi = getAbiForAdapter();
  return new Contract(
    adapterContractAddress,
    abi,
    signer
  ) as RedstoneAdapterBase;
};
