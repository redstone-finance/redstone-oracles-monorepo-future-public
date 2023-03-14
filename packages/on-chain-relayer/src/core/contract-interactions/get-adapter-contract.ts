import { Contract, Wallet } from "ethers";
import { abi } from "../../../artifacts/contracts/price-feeds/PriceFeedsAdapter.sol/PriceFeedsAdapter.json";
import { config } from "../../config";
import { getProvider } from "./get-provider";

export const getManagerContract = async () => {
  const { privateKey, adapterContractAddress } = config;
  const provider = getProvider();
  const signer = new Wallet(privateKey, provider);
  return new Contract(adapterContractAddress, abi, signer);
};
