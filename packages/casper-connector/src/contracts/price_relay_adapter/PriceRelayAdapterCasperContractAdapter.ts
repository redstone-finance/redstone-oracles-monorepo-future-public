import { PriceAdapterCasperContractAdapter } from "../price_adapter/PriceAdapterCasperContractAdapter";
import { ContractParamsProvider } from "@redstone-finance/sdk";
import { BigNumber, BigNumberish } from "ethers";
import {
  ENTRY_POINT_GET_PRICES_CHUNK,
  ENTRY_POINT_WRITE_PRICES_CHUNK,
  STORAGE_KEY_ADAPTER_ADDRESS,
  STORAGE_KEY_VALUES,
} from "../constants";
import { RuntimeArgs } from "casper-js-sdk";
import { RuntimeArgsFactory } from "../RuntimeArgsFactory";
import { casperBlake2b } from "../../casper/casper-blake2b";
import { ComputedValue, computedValueDecoder } from "./ComputedValue";
import { RunMode } from "../RunMode";
import assert from "node:assert";

export class PriceRelayAdapterCasperContractAdapter extends PriceAdapterCasperContractAdapter {
  static PROCESS_CHUNK_CSPR = 1.5;
  static PROCESS_CHUNK_BASE_CSPR = 2;
  public wrappedContractAdapter?: PriceAdapterCasperContractAdapter;

  // eslint-disable-next-line @typescript-eslint/require-await
  override async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    return await (
      await this.getWrappedContractAdapter()
    ).readPricesFromContract(paramsProvider);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async readTimestampFromContract(): Promise<number> {
    return await (
      await this.getWrappedContractAdapter()
    ).readTimestampFromContract();
  }

  override async getPricesFromPayload(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    assert(
      paramsProvider.requestParams.dataFeeds &&
        paramsProvider.requestParams.dataFeeds.length > 0,
      "`dataFeeds` must not be empty"
    );

    const payloadHex = await paramsProvider.getPayloadHex(false);
    const feedIds = paramsProvider.getHexlifiedFeedIds();

    const hash = casperBlake2b(payloadHex, true);

    const deployHash = await this.callPricesEntryPoint(
      RunMode.GET,
      feedIds,
      paramsProvider.requestParams.uniqueSignersCount * feedIds.length,
      payloadHex,
      hash
    );

    await this.assertWaitForDeployAndRefreshStateRootHash(deployHash);

    return await this.extractComputedValues(
      hash,
      paramsProvider.requestParams.dataFeeds
    );
  }

  protected override async callPricesEntryPoint(
    type: RunMode,
    feedIds: string[],
    numberOfPackages: number,
    payloadHex: string,
    hash: string
  ): Promise<string> {
    if (payloadHex.length <= RuntimeArgsFactory.CHUNK_SIZE_BYTES) {
      return await super.callPricesEntryPoint(
        type,
        feedIds,
        numberOfPackages,
        payloadHex,
        hash
      );
    }

    return await this.callChunksEntryPoint(
      type,
      feedIds,
      numberOfPackages,
      payloadHex,
      hash
    );
  }

  private async callChunksEntryPoint(
    type: RunMode,
    feedIds: string[],
    numberOfPackages: number,
    payloadHex: string,
    hash: string
  ) {
    const argList = RuntimeArgsFactory.makeChunkRuntimeArgsList(
      feedIds,
      payloadHex,
      hash
    );

    const deployIds: string[] = [];

    for (let chunkIndex = 0; chunkIndex < argList.length - 1; chunkIndex++) {
      const hashId = await this.callChunkEntryPoint(
        type,
        argList[chunkIndex],
        PriceRelayAdapterCasperContractAdapter.PROCESS_CHUNK_BASE_CSPR +
          (chunkIndex + 1) *
            PriceRelayAdapterCasperContractAdapter.PROCESS_CHUNK_CSPR
      );

      deployIds.push(hashId);
    }

    await this.connection.waitForDeploys(deployIds);

    return await this.callChunkEntryPoint(
      type,
      argList[argList.length - 1],
      numberOfPackages *
        PriceAdapterCasperContractAdapter.SINGLE_PACKAGE_PROCESS_CSPR
    );
  }

  private async callChunkEntryPoint(
    type: RunMode,
    args: RuntimeArgs,
    csprAmount: number
  ) {
    return await this.callEntrypoint(
      type === RunMode.WRITE
        ? ENTRY_POINT_WRITE_PRICES_CHUNK
        : ENTRY_POINT_GET_PRICES_CHUNK,
      csprAmount,
      args
    );
  }

  private async extractComputedValues(hash: string, dataFeedIds: string[]) {
    const computedValues: ComputedValue[] = await this.queryContractDictionary(
      STORAGE_KEY_VALUES,
      hash.substring(2),
      computedValueDecoder
    );

    return computedValues
      .filter((obj) => obj.feedIds.join(",") === dataFeedIds.join(","))
      .reverse()[0].values as BigNumber[];
  }

  private async getWrappedContractAdapter(): Promise<PriceAdapterCasperContractAdapter> {
    if (this.wrappedContractAdapter) {
      return this.wrappedContractAdapter;
    }

    const adapterContract = await this.queryForContract(
      STORAGE_KEY_ADAPTER_ADDRESS
    );

    this.wrappedContractAdapter = new PriceAdapterCasperContractAdapter(
      this.connection,
      adapterContract
    );

    return this.wrappedContractAdapter;
  }
}
