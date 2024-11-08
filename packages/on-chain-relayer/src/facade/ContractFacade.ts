import {
  ContractParamsProvider,
  DataPackagesRequestParams,
  DataPackagesResponseCache,
} from "@redstone-finance/sdk";
import { makeDataPackagesRequestParams } from "../core/make-data-packages-request-params";
import {
  ContractData,
  IterationArgs,
  RelayerConfig,
  ShouldUpdateContext,
  UpdatePricesArgs,
} from "../types";

export abstract class ContractFacade {
  protected constructor(protected cache?: DataPackagesResponseCache) {}

  async getShouldUpdateContext(
    relayerConfig: RelayerConfig
  ): Promise<ShouldUpdateContext> {
    const blockTag = await this.getBlockNumber();
    const [uniqueSignersThreshold, dataFromContract] = await Promise.all([
      this.getUniqueSignersThresholdFromContract(blockTag),
      this.getLastRoundParamsFromContract(blockTag, relayerConfig),
    ]);

    const requestParams = makeDataPackagesRequestParams(
      relayerConfig,
      uniqueSignersThreshold
    );

    const dataPackages =
      await this.getContractParamsProvider(requestParams).requestDataPackages();

    return {
      dataPackages,
      uniqueSignersThreshold,
      dataFromContract,
      blockTag,
    };
  }

  abstract getIterationArgs(
    context: ShouldUpdateContext,
    relayerConfig: RelayerConfig
  ): Promise<IterationArgs>;

  abstract getBlockNumber(): Promise<number>;

  abstract getUniqueSignersThresholdFromContract(
    blockTag: number
  ): Promise<number>;

  abstract getLastRoundParamsFromContract(
    blockTag: number,
    relayerConfig: RelayerConfig
  ): Promise<ContractData>;

  //eslint-disable-next-line  @typescript-eslint/class-methods-use-this
  addExtraFeedsToUpdateParams(
    _iterationArgs: IterationArgs
  ): { message: string; args?: unknown[] }[] {
    return [];
  }

  abstract updatePrices(args: UpdatePricesArgs): Promise<void>;

  getContractParamsProvider(
    requestParams: DataPackagesRequestParams,
    feedIds?: string[]
  ): ContractParamsProvider {
    return new ContractParamsProvider(requestParams, this.cache, feedIds);
  }
}
