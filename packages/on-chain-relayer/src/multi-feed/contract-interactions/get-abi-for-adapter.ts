import { ContractInterface } from "ethers";
import { abi } from "../../../artifacts/contracts/price-feeds/without-rounds/MultiFeedAdapterWithoutRounds.sol/MultiFeedAdapterWithoutRounds.json";

export const getAbiForAdapter = (): ContractInterface => abi;
