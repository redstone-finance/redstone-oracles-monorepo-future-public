import { ContractInterface } from "ethers";
import { abi as redstoneAdapterABI } from "../../../artifacts/contracts/core/RedstoneAdapterBase.sol/RedstoneAdapterBase.json";
import { abi as mentoAdapterABI } from "../../../artifacts/contracts/custom-integrations/mento/MentoAdapterBase.sol/MentoAdapterBase.json";
import { abi as multifeedAdapterABI } from "../../../artifacts/contracts/price-feeds/without-rounds/MultiFeedAdapterWithoutRounds.sol/MultiFeedAdapterWithoutRounds.json";
import { config } from "../../config";

export const getAbiForAdapter = (): ContractInterface => {
  switch (config().adapterContractType) {
    case "price-feeds":
      return redstoneAdapterABI;
    case "multi-feed":
      return multifeedAdapterABI;
    case "mento":
      return mentoAdapterABI;
    default:
      throw new Error(
        `Unsupported adapter contract type: ${config().adapterContractType}`
      );
  }
};
