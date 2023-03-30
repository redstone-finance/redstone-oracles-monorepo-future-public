import { Contract, Wallet } from "ethers";
import { abi as priceFeedsAdapterABI } from "../../../artifacts/contracts/price-feeds/PriceFeedsAdapter.sol/PriceFeedsAdapter.json";
import { abi as mentoAdapterABI } from "../../../artifacts/contracts/custom-integrations/mento/MentoAdapter.sol/MentoAdapter.json";
import { abi as sortedOraclesABI } from "../../../artifacts/contracts/custom-integrations/mento/ISortedOracles.sol/ISortedOracles.json";
import { config } from "../../config";
import { getProvider } from "./get-provider-or-signer";

export const getAdapterContract = () => {
  const { privateKey, adapterContractAddress } = config;
  const provider = getProvider();
  const signer = new Wallet(privateKey, provider);
  const abi = getAbiForAdapter();
  return new Contract(adapterContractAddress, abi, signer);
};

export const getSortedOraclesContractAtAddress = (
  sortedOraclesMentoContractAddress: string
) => {
  return new Contract(
    sortedOraclesMentoContractAddress,
    sortedOraclesABI,
    getProvider()
  );
};

const getAbiForAdapter = () => {
  switch (config.adapterContractType) {
    case "price-feeds":
      return priceFeedsAdapterABI;
    case "mento":
      return mentoAdapterABI;
    default:
      throw new Error(
        `Unsupported adapter contract type: ${config.adapterContractType}`
      );
  }
};
