import { Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import {
  ContractData,
  EvmContractFacade,
  IRedstoneContractAdapter,
} from "@redstone-finance/on-chain-relayer";
import { SignedDataPackage } from "@redstone-finance/protocol";
import {
  ContractParamsProvider,
  DataPackagesRequestParams,
  IContractConnector,
} from "@redstone-finance/sdk";
import { BigNumber } from "ethers";

export class MockContractFacade extends EvmContractFacade {
  constructor(
    connector: IContractConnector<IRedstoneContractAdapter>,
    context: Web3FunctionContext
  ) {
    super(connector, () =>
      Promise.resolve(MockContractFacade.getIterationArgsFromContext(context))
    );
  }

  static getIterationArgsFromContext(context: Web3FunctionContext) {
    const { shouldUpdatePrices, message } = context.userArgs;

    return {
      shouldUpdatePrices: shouldUpdatePrices as boolean,
      args: {
        blockTag: 12221,
        updateRequestParams: {} as DataPackagesRequestParams,
        dataFeedsToUpdate: ["ETH"],
        heartbeatUpdates: [1],
        dataFeedsDeviationRatios: { ETH: 1 },
      },
      messages: [{ message: message as string }],
    };
  }

  override getUniqueSignersThresholdFromContract(
    _blockTag: number
  ): Promise<number> {
    return Promise.resolve(1);
  }

  override getLastRoundParamsFromContract(
    _feedIds: string[],
    _blockTag: number
  ): Promise<ContractData> {
    return Promise.resolve({
      ETH: {
        lastValue: BigNumber.from(20000),
        lastBlockTimestampMS: 1654353399000,
        lastDataPackageTimestampMS: 1654353400000,
      },
    });
  }

  override getContractParamsProvider(
    requestParams: DataPackagesRequestParams,
    feedIds?: string[]
  ) {
    return new ContractParamsProviderStub(requestParams, undefined, feedIds);
  }
}

class ContractParamsProviderStub extends ContractParamsProvider {
  protected override performRequestingDataPackages() {
    const signedDataPackageObj = {
      dataPoints: [{ dataFeedId: "ETH", value: 20000 }],
      timestampMilliseconds: 1654353400000,
      dataServiceId: "service-1",
      signature:
        "NX5yd/Cs8HzVdNchrM59uOoSst7n9KK5Ou9pA6S5GTM0RwghGlFjA0S+SVfb85ipg4HzUTKATBZSqPXlWldEEhw=",
      dataFeedId: "ETH",
      dataPackageId: "ETH",
      signerAddress: "0x2",
    };

    return Promise.resolve({
      ETH: [SignedDataPackage.fromObj(signedDataPackageObj)],
    });
  }
}
