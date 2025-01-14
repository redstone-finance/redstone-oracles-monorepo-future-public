import { SuiClient } from "@mysten/sui/client";
import type { Keypair } from "@mysten/sui/cryptography";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import {
  ContractData,
  type ContractParamsProvider,
  convertDataPackagesResponse,
  type DataPackagesResponse,
  extractSignedDataPackagesForFeedId,
  IMultiFeedPricesContractAdapter,
} from "@redstone-finance/sdk";
import { BigNumberish, utils } from "ethers";
import _ from "lodash";
import type { SuiConfig } from "./config";
import { PriceAdapterDataContent, PriceDataContent } from "./types";
import { makeFeedIdBytes, uint8ArrayToBcs } from "./util";

const DEFAULT_GAS_BUDGET = 10000000n;

export class SuiPricesContractAdapter
  implements IMultiFeedPricesContractAdapter
{
  private readonly client: SuiClient;
  private readonly keypair: Keypair;
  readonly config: SuiConfig;

  constructor(client: SuiClient, config: SuiConfig, keypair: Keypair) {
    this.client = client;
    this.config = config;
    this.keypair = keypair;
  }

  async getUniqueSignerThreshold(): Promise<number> {
    const priceAdapterDataContent =
      await this.getPriceAdapterObjectDataContent();

    return priceAdapterDataContent.config.signer_count_threshold;
  }

  async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    const contractData = await this.readContractData(
      paramsProvider.getDataFeedIds()
    );

    return paramsProvider
      .getDataFeedIds()
      .map((feedId) => contractData[feedId].lastValue);
  }

  async readLatestUpdateBlockTimestamp(feedId: string): Promise<number> {
    const contractData = await this.readContractData([feedId]);

    return Object.values(contractData)[0].lastBlockTimestampMS;
  }

  async readTimestampFromContract(feedId: string): Promise<number> {
    const contractData = await this.readContractData([feedId]);

    return Object.values(contractData)[0].lastDataPackageTimestampMS;
  }

  async readContractData(feedIds: string[]): Promise<ContractData> {
    const priceAdapterDataContent =
      await this.getPriceAdapterObjectDataContent();

    const pricesTableId = priceAdapterDataContent.prices.id.id;
    if (!pricesTableId) {
      throw new Error("Prices table ID not found");
    }

    return _.pick(
      await this.getContractDataFromPricesTable(pricesTableId),
      feedIds
    );
  }

  async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<string> {
    const dataPackagesResponse: DataPackagesResponse =
      await paramsProvider.requestDataPackages();

    const tx = new Transaction();
    tx.setGasBudget(this.config.writePricesTxGasBudget ?? DEFAULT_GAS_BUDGET);

    paramsProvider.getDataFeedIds().forEach((feedId) => {
      const dataPackages = extractSignedDataPackagesForFeedId(
        dataPackagesResponse,
        feedId
      );
      const payload = convertDataPackagesResponse(
        { [feedId]: dataPackages },
        "string"
      );

      this.writePrice(tx, feedId, payload);
    });

    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.keypair,
    });

    return result.digest;
  }

  private writePrice(tx: Transaction, feedId: string, payload: string) {
    tx.moveCall({
      target: `${this.config.packageId}::price_adapter::write_price`,
      arguments: [
        tx.object(this.config.priceAdapterObjectId),
        tx.pure(uint8ArrayToBcs(makeFeedIdBytes(feedId))),
        tx.pure(uint8ArrayToBcs(utils.arrayify("0x" + payload))),
        tx.object(SUI_CLOCK_OBJECT_ID), // Clock object ID
      ],
    });
  }

  //eslint-disable-next-line @typescript-eslint/require-await
  async getPricesFromPayload(
    _paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    throw new Error("Pull model not supported");
  }

  private async getPriceAdapterObjectDataContent() {
    const object = await this.client.getObject({
      id: this.config.priceAdapterObjectId,
      options: { showContent: true },
    });

    if (!object.data?.content) {
      throw new Error("Object not found or has no content");
    }

    return PriceAdapterDataContent.parse(object.data.content);
  }

  private async getContractDataFromPricesTable(pricesTableId: string) {
    const dynamicFields = await this.client.getDynamicFields({
      parentId: pricesTableId,
    });
    if (dynamicFields.data.length === 0) {
      throw new Error("Dynamic fields not found");
    }

    const ids = dynamicFields.data.map((field) => field.objectId);
    const result = await this.client.multiGetObjects({
      ids,
      options: { showContent: true },
    });

    const parsedResults = result.map(
      (response) => PriceDataContent.parse(response.data?.content).value
    );
    const contractData = parsedResults.map((data) => [
      utils.toUtf8String(data.feed_id).replace(/\0+$/, ""),
      {
        lastDataPackageTimestampMS: parseInt(data.timestamp),
        lastBlockTimestampMS: parseInt(data.write_timestamp),
        lastValue: BigInt(data.value),
      },
    ]);

    return Object.fromEntries(contractData) as ContractData;
  }
}
