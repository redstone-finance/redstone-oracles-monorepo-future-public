import {
  ContractParamsProvider,
  IPricesContractAdapter,
} from "@redstone-finance/sdk";
import { BigNumber, BigNumberish } from "ethers";
import assert from "node:assert";
import { casperBlake2b } from "../../casper/casper-blake2b";
import { CasperContractAdapter } from "../CasperContractAdapter";
import { RunMode } from "../RunMode";
import { RuntimeArgsFactory } from "../RuntimeArgsFactory";
import {
  ENTRY_POINT_GET_PRICES,
  ENTRY_POINT_WRITE_PRICES,
  STORAGE_KEY_TIMESTAMP,
  STORAGE_KEY_VALUES,
} from "../constants";

export class PriceAdapterCasperContractAdapter
  extends CasperContractAdapter
  implements IPricesContractAdapter
{
  static SINGLE_PACKAGE_PROCESS_CSPR = 8.5;

  async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<string | BigNumberish[]> {
    const payloadHex = await paramsProvider.getPayloadHex(false);
    const feedIds = paramsProvider.getHexlifiedFeedIds();

    return await this.callPricesEntryPoint(
      RunMode.WRITE,
      feedIds,
      paramsProvider.requestParams.uniqueSignersCount * feedIds.length,
      payloadHex,
      casperBlake2b(payloadHex, true)
    );
  }

  getPricesFromPayload(
    _paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    throw new Error(
      "Method not supported. Use price_relay_adapter contract instead"
    );
  }

  async readTimestampFromContract(): Promise<number> {
    const timestamp: BigNumber = await this.queryContractData(
      STORAGE_KEY_TIMESTAMP
    );

    return timestamp.toNumber();
  }

  async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    const results = await Promise.allSettled(
      paramsProvider.requestParams.dataPackagesIds.map((feedId) =>
        this.readPriceValue(feedId)
      )
    );

    return results.map((result) => {
      switch (result.status) {
        case "fulfilled":
          return (result as PromiseFulfilledResult<BigNumber>).value;
        default:
          return BigNumber.from(0);
      }
    });
  }

  protected async callPricesEntryPoint(
    type: RunMode,
    feedIds: string[],
    numberOfPackages: number,
    payloadHex: string,
    _hash: string
  ) {
    assert(
      payloadHex.length / 2 <= RuntimeArgsFactory.CHUNK_SIZE_BYTES,
      `Payload length (currently: ${payloadHex.length / 2}) must not exceed ${
        RuntimeArgsFactory.CHUNK_SIZE_BYTES
      } bytes. 
      Use price_relay_adapter contract instead`
    );
    const runtimeArgs = RuntimeArgsFactory.makePayloadRuntimeArgs(
      feedIds,
      payloadHex
    );

    return await this.callEntrypoint(
      type === RunMode.WRITE
        ? ENTRY_POINT_WRITE_PRICES
        : ENTRY_POINT_GET_PRICES,
      numberOfPackages *
        PriceAdapterCasperContractAdapter.SINGLE_PACKAGE_PROCESS_CSPR,
      runtimeArgs
    );
  }

  private readPriceValue(feedId: string) {
    return this.queryContractDictionary(STORAGE_KEY_VALUES, feedId);
  }
}
