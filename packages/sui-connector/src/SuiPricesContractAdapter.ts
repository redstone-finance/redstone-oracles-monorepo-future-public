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
import { version } from "../package.json";
import { SuiConfig } from "./config";
import { SuiContractAdapter } from "./SuiContractAdapter";
import { PriceAdapterDataContent, PriceDataContent } from "./types";
import { makeFeedIdBytes, uint8ArrayToBcs } from "./util";

export class SuiPricesContractAdapter
  extends SuiContractAdapter
  implements IMultiFeedPricesContractAdapter
{
  constructor(
    client: SuiClient,
    private readonly config: SuiConfig,
    keypair?: Keypair
  ) {
    super(client, keypair);
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
    return (await this.readAnyRoundDetails(feedId)).lastBlockTimestampMS;
  }

  async readTimestampFromContract(feedId: string): Promise<number> {
    return (await this.readAnyRoundDetails(feedId)).lastDataPackageTimestampMS;
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
    const tx = this.prepareTransaction(this.config.writePricesTxGasBudget);

    const dataPackagesResponse: DataPackagesResponse =
      await paramsProvider.requestDataPackages();

    const metadataTimestamp = Date.now();
    const unsignedMetadata = this.getUnsignedMetadata(metadataTimestamp);

    paramsProvider.getDataFeedIds().forEach((feedId) => {
      const dataPackages = extractSignedDataPackagesForFeedId(
        dataPackagesResponse,
        feedId
      );
      const payload = convertDataPackagesResponse(
        { [feedId]: dataPackages },
        "string",
        unsignedMetadata
      );

      this.writePrice(tx, feedId, payload);
    });
    return await this.sendTransaction(tx);
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

  private async readAnyRoundDetails(feedId: string) {
    return Object.values(await this.readContractData([feedId]))[0];
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

  private getUnsignedMetadata(metadataTimestamp: number): string {
    return `${metadataTimestamp}#${version}#data-packages-wrapper`;
  }
}
