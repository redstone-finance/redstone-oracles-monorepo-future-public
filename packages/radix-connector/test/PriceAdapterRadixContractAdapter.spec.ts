import { NetworkId } from "@radixdlt/radix-engine-toolkit";
import { ContractParamsProviderMock } from "@redstone-finance/sdk";
import { BigNumber } from "ethers";
import {
  PriceAdapterRadixContractAdapter,
  PriceAdapterRadixContractConnector,
  RadixClient,
} from "../src";
import { transactionCommittedDetails } from "./__mocks__/transactions";
import {
  mockDefaultValues,
  transactionCommittedDetailsMock,
} from "./mock-default-values";

const MOCK_PAYLOAD_HEX = "455448";
export const MOCK_PRIVATE_KEY =
  "aa602e9895fd07a75b1becbb3dd5f409664cff5047117eb4a16e8e3c8fdf4641";
const MOCK_COMPONENT_ID =
  "component_tdx_2_1crkz0vvpnuslwwfqmxxne67ygn8wrrtqcqhpn0yex2l27ruyvxg5tm";

export function makeContractParamsProviderMock(
  feedIds: string[] = ["ETH", "BTC"]
) {
  return new ContractParamsProviderMock(feedIds, "./payload.hex", (_) =>
    Buffer.from(MOCK_PAYLOAD_HEX)
  );
}

describe("PriceAdapterRadixContractAdapter tests", () => {
  let sut: PriceAdapterRadixContractAdapter;

  beforeEach(async () => {
    mockDefaultValues();

    sut = await new PriceAdapterRadixContractConnector(
      new RadixClient(NetworkId.Stokenet, { secp256k1: MOCK_PRIVATE_KEY }),
      MOCK_COMPONENT_ID
    ).getAdapter();
  });

  it("readTimestampFromContract should return proper values from state", async () => {
    const timestamp = await sut.readTimestampFromContract();

    expect(timestamp).toBe(1724834030000);
  });

  it("readPricesFromContract should return proper value from the state", async () => {
    const paramsProvider = makeContractParamsProviderMock();

    const prices = await sut.readPricesFromContract(paramsProvider);
    expect(prices).toStrictEqual([
      BigNumber.from("0x394de62046"),
      BigNumber.from("0x05601841c5f4"),
    ]);
  });

  it("readTimestampFromContractWithMethod should return proper value by using method", async () => {
    transactionCommittedDetails.mockResolvedValueOnce(
      transactionCommittedDetailsMock([
        "5c2100",
        "5c0ad00f04e292010000",
        "5c2100",
      ])
    );

    sut.readMode = "CallReadMethod";
    const timestamp = await sut.readTimestampFromContract();

    expect(timestamp).toBe(1730368770000);
  });

  it("getPricesFromPayload should return proper values", async () => {
    const paramsProvider = makeContractParamsProviderMock();

    const prices = await sut.getPricesFromPayload(paramsProvider);
    expect(prices).toStrictEqual([
      BigNumber.from("0x3ccb1063c0"),
      BigNumber.from("0x05a9b5e1a910"),
    ]);
  });

  it("readPricesFromContract should return proper value by using method", async () => {
    const paramsProvider = makeContractParamsProviderMock();

    transactionCommittedDetails.mockResolvedValueOnce(
      transactionCommittedDetailsMock([
        "5c2100",
        "5c2020020a04510467573d0000000000000000000000000000000000000000000000000000000a04a8ec2a3993060000000000000000000000000000000000000000000000000000",
        "5c2100",
      ])
    );

    sut.readMode = "CallReadMethod";
    const prices = await sut.readPricesFromContract(paramsProvider);
    expect(prices).toStrictEqual([
      BigNumber.from("0x3d57670451"),
      BigNumber.from("0x0693392aeca8"),
    ]);
  });

  it("writePricesFromPayloadToContract should return proper values", async () => {
    const paramsProvider = makeContractParamsProviderMock();

    const prices = await sut.writePricesFromPayloadToContract(paramsProvider);
    expect(prices).toStrictEqual([
      BigNumber.from("0x3ccb1063c0"),
      BigNumber.from("0x05a9b5e1a910"),
    ]);
  });
});
