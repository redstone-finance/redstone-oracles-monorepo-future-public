import {
  ContractParamsProvider,
  DataPackagesRequestParams,
  DataPackagesResponseCache,
  IContractConnector,
  IExtendedPricesContractAdapter,
} from "@redstone-finance/sdk";
import { IRedstoneContractAdapter } from "../core/contract-interactions/IRedstoneContractAdapter";
import { makeDataPackagesRequestParams } from "../core/make-data-packages-request-params";
import {
  ContractData,
  IterationArgs,
  RelayerConfig,
  ShouldUpdateContext,
  UpdatePricesArgs,
} from "../types";

export type IterationArgsProvider = (
  context: ShouldUpdateContext,
  relayerConfig: RelayerConfig
) => Promise<IterationArgs>;

export abstract class ContractFacade {
  constructor(
    protected readonly connector: IContractConnector<
      IExtendedPricesContractAdapter | IRedstoneContractAdapter
    >,
    protected iterationArgsProvider: IterationArgsProvider,
    protected cache?: DataPackagesResponseCache
  ) {}

  abstract getLastRoundParamsFromContract(
    feedIds: string[],
    blockTag: number
  ): Promise<ContractData>;

  async getShouldUpdateContext(
    relayerConfig: RelayerConfig
  ): Promise<ShouldUpdateContext> {
    const blockTag = await this.getBlockNumber();
    const [uniqueSignersThreshold, dataFromContract] = await Promise.all([
      this.getUniqueSignersThresholdFromContract(blockTag),
      this.getLastRoundParamsFromContract(relayerConfig.dataFeeds, blockTag),
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

  async getIterationArgs(
    context: ShouldUpdateContext,
    relayerConfig: RelayerConfig
  ): Promise<IterationArgs> {
    return await this.iterationArgsProvider(context, relayerConfig);
  }

  getBlockNumber() {
    return this.connector.getBlockNumber();
  }

  async getUniqueSignersThresholdFromContract(
    blockTag: number
  ): Promise<number> {
    return await (
      await this.connector.getAdapter()
    ).getUniqueSignerThreshold(blockTag);
  }

  async updatePrices(args: UpdatePricesArgs): Promise<void> {
    const adapter = await this.connector.getAdapter();

    await adapter.writePricesFromPayloadToContract(
      this.getContractParamsProvider(
        args.updateRequestParams,
        args.dataFeedsToUpdate
      )
    );
  }

  getContractParamsProvider(
    requestParams: DataPackagesRequestParams,
    feedIds?: string[]
  ): ContractParamsProvider {
    return new ContractParamsProvider(requestParams, this.cache, feedIds);
  }
}
