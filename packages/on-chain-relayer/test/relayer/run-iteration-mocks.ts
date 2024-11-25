import {
  ContractParamsProvider,
  IContractConnector,
} from "@redstone-finance/sdk";
import { BigNumber } from "ethers";
import {
  IRedstoneContractAdapter,
  IterationArgsMessage,
  RelayerConfig,
} from "../../src";
import { ContractData, ShouldUpdateContext } from "../../src/types";

class ContractAdapterMock implements IRedstoneContractAdapter {
  getUniqueSignerThreshold(_blockNumber?: number): Promise<number> {
    return Promise.resolve(1);
  }

  readLatestRoundParamsFromContract(
    _feedIds: string[],
    _blockNumber: number
  ): Promise<ContractData> {
    return Promise.resolve({
      ETH: {
        lastDataPackageTimestampMS: 1732026000000,
        lastBlockTimestampMS: 1732026163000,
        lastValue: BigNumber.from(30000),
      },
      BTC: {
        lastDataPackageTimestampMS: 1732026000000,
        lastBlockTimestampMS: 1732026163000,
        lastValue: BigNumber.from(90000),
      },
    });
  }

  writePricesFromPayloadToContract(
    _paramsProvider: ContractParamsProvider
  ): Promise<void> {
    return Promise.resolve();
  }
}

export class ContractConnectorMock
  implements IContractConnector<ContractAdapterMock>
{
  private adapter = new ContractAdapterMock();

  getAdapter(): Promise<ContractAdapterMock> {
    return Promise.resolve(this.adapter);
  }

  getBlockNumber(): Promise<number> {
    return Promise.resolve(123432);
  }

  waitForTransaction(_txId: string): Promise<boolean> {
    return Promise.resolve(true);
  }
}

export function getIterationArgsProviderMock(
  shouldUpdatePrices = true,
  additionalUpdateMessages?: IterationArgsMessage[]
) {
  return (
    _shouldUpdateContext: ShouldUpdateContext,
    relayerConfig: RelayerConfig
  ) =>
    Promise.resolve({
      shouldUpdatePrices,
      args: {
        blockTag: 123432,
        updateRequestParams: {
          dataPackagesIds: relayerConfig.dataFeeds,
          dataServiceId: relayerConfig.dataServiceId,
          uniqueSignersCount: 1,
        },
        dataFeedsToUpdate: relayerConfig.dataFeeds,
      },
      messages: [{ message: "Test message" }],
      additionalUpdateMessages,
    });
}
