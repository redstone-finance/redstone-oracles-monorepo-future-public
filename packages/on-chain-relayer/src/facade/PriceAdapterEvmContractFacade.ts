import { RedstoneAdapterBase } from "../../typechain-types";
import { getPriceFeedsIterationArgs, RelayerConfig } from "../index";
import { getLastRoundParamsFromContract } from "../price-feeds/args/get-last-round-params";
import { ContractData } from "../types";
import { EvmContractFacade } from "./EvmContractFacade";

export class PriceAdapterEvmContractFacade extends EvmContractFacade<RedstoneAdapterBase> {
  override async getIterationArgs() {
    return await getPriceFeedsIterationArgs(this);
  }

  getLastRoundParamsFromContract(
    blockTag: number,
    relayerConfig: RelayerConfig
  ): Promise<ContractData> {
    return getLastRoundParamsFromContract(
      this.adapterContract,
      blockTag,
      relayerConfig
    );
  }
}
