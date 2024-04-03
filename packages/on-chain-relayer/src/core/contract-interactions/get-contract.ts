import { Contract, ContractInterface, Wallet, providers } from "ethers";
import { abi as redstoneAdapterABI } from "../../../artifacts/contracts/core/RedstoneAdapterBase.sol/RedstoneAdapterBase.json";
import { abi as sortedOraclesABI } from "../../../artifacts/contracts/custom-integrations/mento/ISortedOracles.sol/ISortedOracles.json";
import { abi as mentoAdapterABI } from "../../../artifacts/contracts/custom-integrations/mento/MentoAdapterBase.sol/MentoAdapterBase.json";
import { ISortedOracles, RedstoneAdapterBase } from "../../../typechain-types";
import { config } from "../../config";
import { getRelayerProvider } from "./get-relayer-provider";

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

export const getSortedOraclesContractAtAddress = (
  sortedOraclesMentoContractAddress: string,
  provider: providers.Provider
) => {
  return new Contract(
    sortedOraclesMentoContractAddress,
    sortedOraclesABI,
    provider
  ) as ISortedOracles;
};

export const getAbiForAdapter = (): ContractInterface => {
  switch (config().adapterContractType) {
    case "price-feeds":
      return redstoneAdapterABI;
    case "mento":
      return mentoAdapterABI;
    default:
      throw new Error(
        `Unsupported adapter contract type: ${config().adapterContractType}`
      );
  }
};
