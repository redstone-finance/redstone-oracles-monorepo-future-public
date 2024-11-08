import { RedstoneAdapterBase } from "../../typechain-types";
import { RelayerConfig } from "../index";
import { getIterationArgs } from "../price-feeds/args/get-iteration-args";
import { getLastRoundParamsFromContract } from "../price-feeds/args/get-last-round-params";
import { ContractData, ShouldUpdateContext } from "../types";
import { EvmContractFacade } from "./EvmContractFacade";

export class PriceAdapterEvmContractFacade extends EvmContractFacade<RedstoneAdapterBase> {
  override async getIterationArgs(
    context: ShouldUpdateContext,
    relayerConfig: RelayerConfig
  ) {
    return await getIterationArgs(this, context, relayerConfig);
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
