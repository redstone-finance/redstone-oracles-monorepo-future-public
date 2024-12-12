import {
  GatewayApiClient,
  StateEntityDetailsResponseComponentDetails,
} from "@radixdlt/babylon-gateway-api-sdk";
import { Convert, NetworkId, Value } from "@radixdlt/radix-engine-toolkit";
import { RadixParser } from "./parser/RadixParser";

export class RadixApiClient {
  readonly apiClient: GatewayApiClient;

  constructor(
    applicationName: string,
    private networkId = NetworkId.Stokenet
  ) {
    this.apiClient = GatewayApiClient.initialize({
      applicationName,
      networkId,
    });
  }

  async getTransactionDetails(transactionId: string) {
    const receipt =
      await this.apiClient.transaction.innerClient.transactionCommittedDetails({
        transactionCommittedDetailsRequest: {
          intent_hash: transactionId,
          opt_ins: { receipt_output: true },
        },
      });

    if (receipt.transaction.transaction_status !== "CommittedSuccess") {
      throw new Error(
        receipt.transaction.error_message ??
          receipt.transaction.transaction_status
      );
    }

    const output = receipt.transaction.receipt?.output as {
      hex: string;
    }[];

    return (
      await Promise.all(
        output.map((object) =>
          RadixParser.decodeSborHex(object.hex, this.networkId)
        )
      )
    ).map((value) => RadixParser.extractValue(value));
  }

  async submitTransaction(compiledTransaction: Uint8Array) {
    const notarizedTransactionHex =
      Convert.Uint8Array.toHexString(compiledTransaction);

    return (
      await this.apiClient.transaction.innerClient.transactionSubmit({
        transactionSubmitRequest: {
          notarized_transaction_hex: notarizedTransactionHex,
        },
      })
    ).duplicate;
  }

  async getTransactionStatus(transactionId: string) {
    return await this.apiClient.transaction.innerClient.transactionStatus({
      transactionStatusRequest: {
        intent_hash: transactionId,
      },
    });
  }

  async getCurrentEpochNumber() {
    return (await this.apiClient.status.getCurrent()).ledger_state.epoch;
  }

  async getStateFields(componentId: string, fieldNames?: string[]) {
    const res =
      await this.apiClient.state.getEntityDetailsVaultAggregated(componentId);
    const state = (
      res.details as unknown as StateEntityDetailsResponseComponentDetails
    ).state as { fields: { field_name: string }[] };

    const fields = state.fields.filter(
      (field) => fieldNames?.includes(field.field_name) !== false
    );
    const entries = fields.map((field) => [
      field.field_name,
      RadixParser.convertValue(field),
    ]);

    return Object.fromEntries(entries) as { [p: string]: Value };
  }
}
