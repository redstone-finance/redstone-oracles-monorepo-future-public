import {
  IPriceFeedContractAdapter,
  PriceAndTimestamp,
} from "@redstone-finance/sdk";
import { BigNumber, BigNumberish } from "ethers";
import { CasperContractAdapter } from "../CasperContractAdapter";
import {
  ENTRY_POINT_GET_PRICE_AND_TIMESTAMP,
  STORAGE_KEY_TIMESTAMP,
  STORAGE_KEY_VALUE,
} from "../constants";

export class PriceFeedCasperContractAdapter
  extends CasperContractAdapter
  implements IPriceFeedContractAdapter
{
  private static GET_PRICE_AND_TIMESTAMP_CSPR = 1;

  async getPriceAndTimestamp(): Promise<PriceAndTimestamp> {
    const deployId = await this.callEntrypoint(
      ENTRY_POINT_GET_PRICE_AND_TIMESTAMP,
      PriceFeedCasperContractAdapter.GET_PRICE_AND_TIMESTAMP_CSPR
    );
    await this.assertWaitForDeployAndRefreshStateRootHash(deployId);

    return {
      value: await this.readValueFromContract(),
      timestamp: await this.readTimestampFromContract(),
    };
  }

  async readTimestampFromContract(): Promise<number> {
    const timestamp: BigNumber = await this.queryContractData(
      STORAGE_KEY_TIMESTAMP
    );

    return timestamp.toNumber();
  }

  async readValueFromContract(): Promise<BigNumberish> {
    return await this.queryContractData(STORAGE_KEY_VALUE);
  }
}
