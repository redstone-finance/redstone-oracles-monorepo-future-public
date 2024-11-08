import {
  DataPackagesResponseCache,
  IContractConnector,
  IPricesContractAdapter,
} from "@redstone-finance/sdk";
import { BigNumber } from "ethers";
import { zip } from "lodash";
import { RelayerConfig, UpdatePricesArgs } from "../index";
import { getIterationArgs } from "../price-feeds/args/get-iteration-args";
import { ContractData, IterationArgs, ShouldUpdateContext } from "../types";
import { ContractFacade } from "./ContractFacade";

export class NonEvmContractFacade<
  Connector extends IContractConnector<Adapter>,
  Adapter extends IPricesContractAdapter,
> extends ContractFacade {
  constructor(
    protected contractConnector: Connector,
    cache?: DataPackagesResponseCache
  ) {
    super(cache);
  }

  async getIterationArgs(
    context: ShouldUpdateContext,
    relayerConfig: RelayerConfig
  ): Promise<IterationArgs> {
    return await getIterationArgs(this, context, relayerConfig);
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
        this.getContractParamsProvider(
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
          lastBlockTimestampMS: latestUpdateBlockTimestamp ?? timestamp,
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

  async updatePrices(args: UpdatePricesArgs): Promise<void> {
    const adapter = await this.contractConnector.getAdapter();

    await adapter.writePricesFromPayloadToContract(
      this.getContractParamsProvider(
        args.updateRequestParams,
        args.dataFeedsToUpdate
      )
    );
  }

  private async getDataPackageRequestParams(
    blockTag: number,
    dataServiceId: string,
    dataFeeds: string[]
  ) {
    const uniqueSignersCount =
      await this.getUniqueSignersThresholdFromContract(blockTag);
    return {
      dataServiceId,
      uniqueSignersCount,
      dataPackagesIds: dataFeeds,
    };
  }
}
