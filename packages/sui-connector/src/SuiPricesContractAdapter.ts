import { DynamicFieldPage, SuiClient } from "@mysten/sui/client";
import type { Keypair } from "@mysten/sui/cryptography";
import { Transaction } from "@mysten/sui/transactions";
import {
  convertDataPackagesResponse,
  type ContractParamsProvider,
  type DataPackagesResponse,
  type IExtendedPricesContractAdapter,
} from "@redstone-finance/sdk";
import type { BigNumberish } from "ethers";
import type { SuiConfig } from "../src/config";
import { makeFeedIdBytes, uint8ArrayToBcs } from "../src/util";
import { PriceAdapterDataContent, PriceDataContent } from "./types";

export class SuiPricesContractAdapter
  implements IExtendedPricesContractAdapter
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
    return priceAdapterDataContent.fields.config.fields.signer_count_threshold;
  }

  async readLatestUpdateBlockTimestamp(): Promise<number> {
    const priceDataObject = await this.getOneOfFeedIdsPriceDataContent();
    return parseInt(priceDataObject.fields.value.fields.write_timestamp);
  }

  async readTimestampFromContract(): Promise<number> {
    const priceDataContent = await this.getOneOfFeedIdsPriceDataContent();
    return parseInt(priceDataContent.fields.value.fields.timestamp);
  }

  private async getOneOfFeedIdsPriceDataContent() {
    const priceAdapterDataContent =
      await this.getPriceAdapterObjectDataContent();

    const pricesTableId = priceAdapterDataContent.fields.prices.fields.id.id;
    if (!pricesTableId) {
      throw new Error("Prices table ID not found");
    }

    const priceDataContent =
      await this.getPriceDataContentFromPricesTable(pricesTableId);

    return priceDataContent;
  }

  async getPricesFromPayload(
    _paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    throw new Error("Pull model not supported");
  }

  async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<string> {
    const dataPackages: DataPackagesResponse =
      await paramsProvider.requestDataPackages();

    const tx = new Transaction();

    tx.setGasBudget(this.config.writePricesTxGasBudget);

    // TODO use `extractSignedDataPackagesForFeedId` from @redstone-finance/sdk
    Object.entries(dataPackages).forEach(([feedId, dataPackages]) => {
      const payload = convertDataPackagesResponse(
        { [feedId]: dataPackages },
        "bytes"
      );
      tx.moveCall({
        target: `${this.config.packageId}::price_adapter::write_price`,
        arguments: [
          tx.object(this.config.priceAdapterObjectId),
          tx.pure(uint8ArrayToBcs(makeFeedIdBytes(feedId))),
          tx.pure(uint8ArrayToBcs(new Uint8Array(JSON.parse(payload)))),
          tx.object("0x6"), // Clock object ID
        ],
      });
    });

    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.keypair,
    });

    return result.digest;
  }

  async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    const feedIds = paramsProvider.getDataFeedIds();
    const promises = await Promise.all(
      feedIds.map((feedId) => this.getPrice(feedId))
    );
    return promises.map((priceData) => BigInt(priceData.value));
  }

  private async getPriceAdapterObjectDataContent() {
    const object = await this.client.getObject({
      id: this.config.priceAdapterObjectId,
      options: { showContent: true },
    });

    if (!object.data?.content) {
      throw new Error("Object not found or has no content");
    }

    const priceAdapterDataContent = PriceAdapterDataContent.parse(
      object.data.content
    );

    return priceAdapterDataContent;
  }

  private async getPrice(feedId: string) {
    const priceAdapterDataContent =
      await this.getPriceAdapterObjectDataContent();

    const pricesTableId = priceAdapterDataContent.fields.prices.fields.id.id;
    if (!pricesTableId) {
      throw new Error("Prices table ID not found");
    }

    const priceDataContent = await this.getPriceDataContentFromPricesTable(
      pricesTableId,
      feedId
    );

    return priceDataContent.fields.value.fields;
  }

  private async getPriceDataContentFromPricesTable(
    pricesTableId: string,
    feedId?: string
  ) {
    const dynamicFields = await this.client.getDynamicFields({
      parentId: pricesTableId,
    });
    if (dynamicFields.data.length === 0) {
      throw new Error("Dynamic fields not found");
    }

    const feedField = this.filterDynamicFields(dynamicFields, feedId);
    if (!feedField?.objectId) {
      throw new Error("Feed for the given field not found");
    }

    const feedObject = await this.client.getObject({
      id: feedField.objectId,
      options: { showContent: true },
    });

    if (!feedObject?.data?.content) {
      throw new Error("Feed object has no fields");
    }

    return PriceDataContent.parse(feedObject.data.content);
  }

  private filterDynamicFields(
    dynamicFields: DynamicFieldPage,
    feedId?: string
  ) {
    if (feedId) {
      const feedIdBytes = makeFeedIdBytes(feedId);
      return dynamicFields.data.find(
        (field) => field.name.value!.toString() === feedIdBytes.toString()
      );
    }
    return dynamicFields.data[0];
  }
}
