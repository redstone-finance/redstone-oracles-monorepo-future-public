import {
  ContractParamsProvider,
  IExtendedPricesContractAdapter,
} from "@redstone-finance/sdk";
import { BigNumberish } from "ethers";
import { RadixContractAdapter } from "../../radix/RadixContractAdapter";
import { GetPricesRadixMethod } from "./methods/GetPricesRadixMethod";
import { ReadPricesRadixMethod } from "./methods/ReadPricesRadixMethod";
import { ReadTimestampRadixMethod } from "./methods/ReadTimestampRadixMethod";
import { WritePricesRadixMethod } from "./methods/WritePricesRadixMethod";

export class PriceAdapterRadixContractAdapter
  extends RadixContractAdapter
  implements IExtendedPricesContractAdapter
{
  async getPricesFromPayload(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    return (
      await this.client.call(
        new GetPricesRadixMethod(
          this.componentId,
          paramsProvider.getDataFeedIds(),
          await paramsProvider.getPayloadData()
        )
      )
    ).values;
  }

  async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<string | BigNumberish[]> {
    return (
      await this.client.call(
        new WritePricesRadixMethod(
          this.componentId,
          paramsProvider.getDataFeedIds(),
          await paramsProvider.getPayloadData()
        )
      )
    ).values;
  }

  async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    const priceMap: { [p: string]: BigNumberish } = await this.client.readValue(
      this.componentId,
      "prices"
    );

    return paramsProvider
      .getHexlifiedFeedIds()
      .map((feedId) => priceMap[feedId]);
  }

  async readTimestampFromContract(): Promise<number> {
    return Number(await this.client.readValue(this.componentId, "timestamp"));
  }

  async readPricesFromContractWithMethod(
    paramsProvider: ContractParamsProvider
  ) {
    return await this.client.call(
      new ReadPricesRadixMethod(
        this.componentId,
        paramsProvider.getDataFeedIds()
      )
    );
  }

  async readTimestampFromContractWithMethod() {
    return Number(
      await this.client.call(new ReadTimestampRadixMethod(this.componentId))
    );
  }

  async getUniqueSignerThreshold(): Promise<number> {
    return Number(
      await this.client.readValue(this.componentId, "signer_count_threshold")
    );
  }

  async readLatestUpdateBlockTimestamp(): Promise<number | undefined> {
    const value = await this.client.readValue(
      this.componentId,
      "latest_update_timestamp"
    );

    return value ? Number(value) : (value as undefined);
  }
}
