import { DataPackagesWrapper } from "@redstone-finance/evm-connector";
import {
  DataServiceIds,
  getSignersForDataServiceId,
} from "@redstone-finance/oracles-smartweave-contracts";
import {
  getDataPackagesTimestamp,
  requestDataPackages,
} from "@redstone-finance/sdk";
import { Adapter } from "erc7412";
import * as viem from "viem";

const MAX_TIMESTAMP_DEVIATION = 180_000;

export class RedstoneAdapter implements Adapter {
  getOracleId(): string {
    return "REDSTONE";
  }

  async fetchOffchainData(
    _client: unknown,
    requester: viem.Address,
    data: viem.Hex
  ): Promise<viem.Hex> {
    const [feedId, uniqueSignersCount, dataServiceId] =
      viem.decodeAbiParameters(
        [{ type: "bytes32" }, { type: "uint8" }, { type: "string" }],
        data
      ) as [string, number, string];

    const dataPackages = await requestDataPackages({
      dataPackagesIds: [bytes32ToString(feedId)],
      dataServiceId,
      uniqueSignersCount,
      maxTimestampDeviationMS: MAX_TIMESTAMP_DEVIATION,
      authorizedSigners: getSignersForDataServiceId(
        dataServiceId as DataServiceIds
      ),
    });

    const signedRedstonePayload = await new DataPackagesWrapper(
      dataPackages
    ).prepareRedstonePayload(true);

    const dataTimestamp = BigInt(getDataPackagesTimestamp(dataPackages));
    const encodedDataTimestamp = viem.encodeAbiParameters(
      [{ type: "uint256" }],
      [dataTimestamp]
    );

    return `${encodedDataTimestamp}${signedRedstonePayload}`;
  }
}

const bytes32ToString = (bytes32: string) => {
  const arrayOfChars = bytes32.slice(2).split("");

  while (arrayOfChars[arrayOfChars.length - 2] === "0") {
    arrayOfChars.pop();
  }

  return Buffer.from(arrayOfChars.join(""), "hex").toString();
};
