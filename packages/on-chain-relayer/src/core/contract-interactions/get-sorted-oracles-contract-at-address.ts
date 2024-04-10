import { Contract, providers } from "ethers";
import { abi as sortedOraclesABI } from "../../../artifacts/contracts/custom-integrations/mento/ISortedOracles.sol/ISortedOracles.json";
import { ISortedOracles } from "../../../typechain-types";

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
