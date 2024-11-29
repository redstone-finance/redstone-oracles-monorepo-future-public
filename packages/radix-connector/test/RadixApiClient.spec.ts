import { Convert } from "@radixdlt/radix-engine-toolkit";
import { RadixApiClient } from "../src/radix/RadixApiClient";
import {
  getCurrent,
  getEntityDetailsVaultAggregated,
  transactionCommittedDetails,
  transactionStatus,
  transactionSubmit,
} from "./__mocks__/transactions";
import { mockDefaultValues } from "./mock-default-values";

jest.spyOn(Convert.Uint8Array, "toHexString");

describe("RadixApiClient", () => {
  let sut: RadixApiClient;

  beforeAll(mockDefaultValues);

  beforeEach(() => {
    sut = new RadixApiClient("TestApp");
  });

  it("should get transaction details", async () => {
    const mockResponse = {
      transaction: {
        receipt: {
          output: [
            {
              hex: "5c21020a90d4838e91010000200c020c3078334644354338314238450d30783543464543394630413538",
            },
          ],
        },
      },
    };
    transactionCommittedDetails.mockResolvedValueOnce(mockResponse);

    const result = await sut.getTransactionDetails("mockTransactionId");
    expect(transactionCommittedDetails).toHaveBeenCalledWith({
      transactionCommittedDetailsRequest: {
        intent_hash: "mockTransactionId",
        opt_ins: { receipt_output: true },
      },
    });
    expect(result).toEqual([
      [1724672890000n, ["0x3FD5C81B8E", "0x5CFEC9F0A58"]],
    ]);
  });

  it("should submit a transaction", async () => {
    const result = await sut.submitTransaction(new Uint8Array([1, 2, 3]));
    expect(result).toEqual(false);
    expect(Convert.Uint8Array.toHexString).toHaveBeenCalledWith(
      new Uint8Array([1, 2, 3])
    );
    expect(transactionSubmit).toHaveBeenCalledWith({
      transactionSubmitRequest: {
        notarized_transaction_hex: "010203",
      },
    });
  });

  it("should get transaction status", async () => {
    await sut.getTransactionStatus("mockTransactionId");

    expect(transactionStatus).toHaveBeenCalledWith({
      transactionStatusRequest: { intent_hash: "mockTransactionId" },
    });
  });

  it("should get current epoch number", async () => {
    const result = await sut.getCurrentEpochNumber();
    expect(result).toBe(100);
    expect(getCurrent).toHaveBeenCalled();
  });

  it("should get state fields", async () => {
    const result = await sut.getStateFields("mockComponentId", [
      "signer_count_threshold",
    ]);
    expect(result).toEqual({ signer_count_threshold: 1 });
    expect(getEntityDetailsVaultAggregated).toHaveBeenCalledWith(
      "mockComponentId"
    );
  });
});
