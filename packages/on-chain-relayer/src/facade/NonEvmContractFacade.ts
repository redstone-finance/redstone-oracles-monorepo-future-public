import {
  ContractParamsProvider,
  convertDataPackagesResponse,
  DataPackagesRequestParams,
  IContractConnector,
  IPricesContractAdapter,
} from "@redstone-finance/sdk";
import { BigNumber } from "ethers";
import { zip } from "lodash";
import { config } from "../config";
import {
  getPriceFeedsIterationArgs,
  IContractFacade,
  RelayerConfig,
  UpdatePricesArgs,
} from "../index";
import { ContractData, IterationArgs } from "../types";

export class NonEvmContractFacade<
  Connector extends IContractConnector<Adapter>,
  Adapter extends IPricesContractAdapter,
> implements IContractFacade
{
  constructor(protected contractConnector: Connector) {}

  async getIterationArgs(): Promise<IterationArgs> {
    return await getPriceFeedsIterationArgs(this);
  }

  async getLastRoundParamsFromContract(
    blockTag: number,
    relayerConfig: RelayerConfig
  ) {
    const adapter = await this.contractConnector.getAdapter();

    const [timestamp, latestUpdateBlockTimestamp, prices] = await Promise.all([
      await adapter.readTimestampFromContract(),
      await adapter.readLatestUpdateBlockTimestamp!(),
      await adapter.readPricesFromContract(
        new ContractParamsProvider(
          await this.getDataPackageRequestParams(
            blockTag,
            relayerConfig.dataServiceId,
            relayerConfig.dataFeeds
          )
        )
      ),
    ]);

    const entries = zip(relayerConfig.dataFeeds, prices).map(
      ([feedId, price]) => [
        feedId,
        {
          lastDataPackageTimestampMS: timestamp,
          lastBlockTimestampMS:
            (latestUpdateBlockTimestamp ?? timestamp) * 1000,
          lastValue: BigNumber.from(price),
        },
      ]
    );

    return Object.fromEntries(entries) as ContractData;
  }

  async getUniqueSignersThresholdFromContract(
    _blockTag: number
  ): Promise<number> {
    const adapter = await this.contractConnector.getAdapter();

    return await adapter.getUniqueSignerThreshold!();
  }

  getBlockNumber() {
    return this.contractConnector.getBlockNumber();
  }

  addExtraFeedsToUpdateParams(
    _iterationArgs: IterationArgs
  ): { message: string; args?: unknown[] }[] {
    return [];
  }

  async updatePrices(args: UpdatePricesArgs): Promise<void> {
    const adapter = await this.contractConnector.getAdapter();
    const relayerConfig = config();

    await adapter.writePricesFromPayloadToContract(
      new RelayerContractParamsProvider(
        await this.getDataPackageRequestParams(
          args.blockTag,
          relayerConfig.dataServiceId,
          relayerConfig.dataFeeds,
          relayerConfig.dataPackagesNames
        ),
        relayerConfig.dataFeeds,
        args
      )
    );
  }

  private async getDataPackageRequestParams(
    blockTag: number,
    dataServiceId: string,
    dataFeeds: string[],
    dataPackagesNames?: string[]
  ) {
    return {
      dataServiceId,
      uniqueSignersCount:
        await this.getUniqueSignersThresholdFromContract(blockTag),
      dataPackagesIds: dataPackagesNames ?? dataFeeds,
    };
  }
}

class RelayerContractParamsProvider extends ContractParamsProvider {
  constructor(
    params: DataPackagesRequestParams,
    protected feedIds: string[],
    protected args: UpdatePricesArgs
  ) {
    super(params);
  }

  protected override async requestPayload(
    _requestParams: DataPackagesRequestParams
  ): Promise<string> {
    const dataPackages = await this.args.fetchDataPackages();

    return convertDataPackagesResponse(dataPackages);
  }

  override getDataFeedIds(): string[] {
    return this.feedIds;
  }
}
