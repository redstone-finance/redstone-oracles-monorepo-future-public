import {
  ContractData,
  EvmContractFacade,
} from "@redstone-finance/on-chain-relayer";
import { SignedDataPackage } from "@redstone-finance/protocol";
import {
  ContractParamsProvider,
  DataPackagesRequestParams,
} from "@redstone-finance/sdk";
import { BigNumber } from "ethers";

export class MockContractFacade extends EvmContractFacade {
  override getUniqueSignersThresholdFromContract(
    _blockTag: number
  ): Promise<number> {
    return Promise.resolve(1);
  }

  override getLatestRoundContractData(
    _feedIds: string[],
    _blockTag: number,
    _withDataFeedValues: boolean
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
