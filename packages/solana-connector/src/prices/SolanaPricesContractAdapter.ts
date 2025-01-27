import {
  ContractParamsProvider,
  convertDataPackagesResponse,
  IExtendedPricesContractAdapter,
} from "@redstone-finance/sdk";
import { BigNumberish } from "ethers";

import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { PriceAdapterContract } from "../PriceContractAdapter";

export class SolanaPricesContractAdapter
  implements IExtendedPricesContractAdapter
{
  private contract: PriceAdapterContract;
  constructor(
    readonly connection: Connection,
    readonly keypair: Keypair
  ) {
    this.contract = new PriceAdapterContract(connection, keypair);
  }

  async getUniqueSignerThreshold(): Promise<number> {
    return await this.contract.getUniqueSignerThreshold();
  }

  async readLatestUpdateBlockTimestamp(
    feedId?: string
  ): Promise<number | undefined> {
    if (feedId === undefined) return undefined;
    const priceData = await this.contract.getPriceData(feedId);

    return priceData.writeTimestamp?.toNumber();
  }

  getPricesFromPayload(_: ContractParamsProvider): Promise<BigNumberish[]> {
    throw new Error("Pull model not supported");
  }

  async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<string | BigNumberish[]> {
    const dataPackages = await paramsProvider.requestDataPackages();

    const tx = new Transaction();

    for (const [feedId, dataPackage] of Object.entries(dataPackages)) {
      const payload = convertDataPackagesResponse(
        { [feedId]: dataPackage },
        "bytes"
      );
      const ix = await this.contract.writePriceIx(
        this.keypair.publicKey,
        feedId,
        payload
      );

      tx.add(ix);
    }

    return await sendAndConfirmTransaction(this.connection, tx, [this.keypair]);
  }

  async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    const feedIds = paramsProvider.getDataFeedIds();
    const promises = await Promise.all(
      feedIds.map((feedId) => this.contract.getPriceData(feedId))
    );
    return promises.map((priceData) => BigInt(toNumber(priceData.value)));
  }

  async readTimestampFromContract(feedId: string): Promise<number> {
    const priceData = await this.contract.getPriceData(feedId);

    return priceData.timestamp.toNumber();
  }
}

function toNumber(values: number[]): number {
  let result = 0;
  for (const value of values) {
    result = result * 256 + value;
  }
  return result;
}
