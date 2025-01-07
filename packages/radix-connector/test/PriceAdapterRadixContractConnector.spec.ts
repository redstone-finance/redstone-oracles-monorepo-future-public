import { NetworkId } from "@radixdlt/radix-engine-toolkit";
import { PriceAdapterRadixContractDeployer, RadixClient } from "../src";
import {
  transactionCommittedDetails,
  transactionStatus,
} from "./__mocks__/transactions";
import {
  mockDefaultValues,
  transactionCommittedDetailsMock,
} from "./mock-default-values";
import { MOCK_PRIVATE_KEY } from "./PriceAdapterRadixContractAdapter.spec";

const MOCK_PACKAGE_ID =
  "package_tdx_2_1phugcdw02atg0m9mvc9lzq0hmyktrmytmqttnc22wce2dgychs6gtq";

describe("PriceAdapterRadixContractConnector tests", () => {
  let sut: PriceAdapterRadixContractDeployer;

  beforeEach(() => {
    mockDefaultValues();

    sut = new PriceAdapterRadixContractDeployer(
      new RadixClient(NetworkId.Stokenet, { ed25519: MOCK_PRIVATE_KEY }),
      MOCK_PACKAGE_ID,
      1,
      [
        "0x12470f7aba85c8b81d63137dd5925d6ee114952b",
        "0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB",
        "0x1ea62d73edf8ac05dfcea1a34b9796e937a29eff",
        "0x2c59617248994D12816EE1Fa77CE0a64eEB456BF",
        "0x83cba8c619fb629b81a65c2e67fe15cf3e3c9747",
        "0xf786a909d559f5dee2dc6706d8e5a81728a39ae9",
      ]
    );
  });

  it("PriceAdapterRadixContractDeployer should instantiate only once", async () => {
    transactionCommittedDetails.mockResolvedValueOnce(
      transactionCommittedDetailsMock([
        "5c2100",
        "5c80c0eb30370cafa2b014b880b80e602470b48ec19d01ee74ac5c603f4f0347",
        "5c2100",
      ])
    );
    const value = await sut.getComponentId();

    expect(value).toBe(
      "component_tdx_2_1cr4nqdcv473tq99cszuqucpywz6gasvaq8h8ftzuvql57q684j8xur"
    );

    const value2 = await sut.getComponentId();
    expect(value2).toBe(
      "component_tdx_2_1cr4nqdcv473tq99cszuqucpywz6gasvaq8h8ftzuvql57q684j8xur"
    );
  });

  it("PriceAdapterRadixContractConnector should return block number", async () => {
    const result = await sut.getBlockNumber();
    expect(result).toBe(100);
  });

  it("PriceAdapterRadixContractConnector should wait for successful transaction", async () => {
    transactionStatus.mockResolvedValueOnce({ intent_status: "Pending" });
    const result = await sut.waitForTransaction("mockTransactionId");
    expect(result).toBe(true);
  });

  it("PriceAdapterRadixContractConnector should wait for failed transaction", async () => {
    transactionStatus.mockResolvedValueOnce({
      intent_status: "CommittedFailure",
      error_message: "mockedError",
    });
    const result = await sut.waitForTransaction("mockTransactionId");
    expect(result).toBe(false);
  });
});
