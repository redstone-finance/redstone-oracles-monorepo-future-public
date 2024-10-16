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

export class NonEvmContractFacade<Adapter extends IPricesContractAdapter>
  implements IContractFacade
{
  constructor(protected contractConnector: IContractConnector<Adapter>) {}

  async getIterationArgs(): Promise<IterationArgs> {
    return await getPriceFeedsIterationArgs(this);
  }

  async getLastRoundParamsFromContract(
    blockTag: number,
    relayerConfig: RelayerConfig
  ) {
    const adapter = await this.contractConnector.getAdapter();

    const timestamp = await adapter.readTimestampFromContract();
    const dataFeedIds = relayerConfig.dataFeeds;
    const prices = await adapter.readPricesFromContract(
      new ContractParamsProvider({
        dataPackagesIds: dataFeedIds,
        dataServiceId: relayerConfig.dataServiceId,
        uniqueSignersCount:
          await this.getUniqueSignersThresholdFromContract(blockTag),
      })
    );

    const entries = zip(dataFeedIds, prices).map(([feedId, price]) => [
      feedId,
      {
        lastDataPackageTimestampMS: timestamp,
        lastBlockTimestampMS: timestamp,
        lastValue: BigNumber.from(price),
      },
    ]);

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
        {
          dataServiceId: relayerConfig.dataServiceId,
          uniqueSignersCount: await this.getUniqueSignersThresholdFromContract(
            args.blockTag
          ),
          dataPackagesIds: relayerConfig.dataFeeds,
        },
        args
      )
    );
  }
}

class RelayerContractParamsProvider extends ContractParamsProvider {
  constructor(
    params: DataPackagesRequestParams,
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
}
