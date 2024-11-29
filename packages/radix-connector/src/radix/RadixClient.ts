import {
  defaultValidationConfig,
  generateRandomNonce,
  NetworkId,
  NotarizedTransaction,
  PrivateKey,
  RadixEngineToolkit,
  TransactionBuilder,
  TransactionHeader,
} from "@radixdlt/radix-engine-toolkit";
import { RedstoneCommon } from "@redstone-finance/utils";
import { RadixApiClient } from "./RadixApiClient";
import { RadixInvocation } from "./RadixInvocation";
import { RadixTransaction } from "./RadixTransaction";

export class RadixClient {
  protected readonly signer: PrivateKey;
  protected readonly apiClient: RadixApiClient;

  constructor(
    privateKey: { ed25519?: string; secp256k1?: string },
    protected networkId = NetworkId.Stokenet,
    applicationName = "RedStone Radix Connector"
  ) {
    this.signer = RadixClient.makeSigner(privateKey);
    this.apiClient = new RadixApiClient(applicationName, networkId);
  }

  static makeSigner(privateKey: {
    ed25519?: string;
    secp256k1?: string;
  }): PrivateKey {
    if (privateKey.ed25519) {
      return new PrivateKey.Ed25519(privateKey.ed25519);
    }

    if (privateKey.secp256k1) {
      return new PrivateKey.Secp256k1(privateKey.secp256k1);
    }

    throw new Error("No Ed25519 nor Secp256k1 private key passed!");
  }

  async call<T>(
    method: RadixInvocation<T>,
    proofResourceId?: string
  ): Promise<T> {
    const transaction = method.getDedicatedTransaction(
      await this.getAccountAddress(),
      proofResourceId
    );
    const transactionId = await this.callTransaction(transaction);
    await this.waitForCommit(transactionId.id);
    const output = await this.apiClient.getTransactionDetails(transactionId.id);

    return transaction.interpret(output) as T;
  }

  async readValue<T>(componentId: string, fieldName: string) {
    return (await this.apiClient.getStateFields(componentId, [fieldName]))[
      fieldName
    ] as T;
  }

  async getCurrentEpochNumber() {
    return await this.apiClient.getCurrentEpochNumber();
  }

  async waitForCommit(
    transactionId: string,
    pollDelayMs = 500,
    pollAttempts = 60000 / pollDelayMs
  ) {
    for (let i = 0; i < pollAttempts; i++) {
      const statusOutput =
        await this.apiClient.getTransactionStatus(transactionId);
      console.debug(
        `Transaction ${transactionId} is ${statusOutput.intent_status}`
      );
      switch (statusOutput.intent_status) {
        case "CommittedSuccess": {
          return true;
        }
        case "CommittedFailure":
          throw new Error(
            `Transaction ${transactionId} failed: ${statusOutput.error_message}`
          );
      }
      await RedstoneCommon.sleep(pollDelayMs);
    }

    throw new Error(
      `Transaction ${transactionId} was not committed during ${pollDelayMs * pollAttempts} [ms]`
    );
  }

  protected async getAccountAddress() {
    return await RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(
      this.signer.publicKey(),
      this.networkId
    );
  }

  private async callTransaction(transaction: RadixTransaction) {
    const currentEpochNumber = await this.apiClient.getCurrentEpochNumber();
    const transactionHeader: TransactionHeader = {
      networkId: this.networkId,
      startEpochInclusive: currentEpochNumber,
      endEpochExclusive: currentEpochNumber + 100,
      nonce: generateRandomNonce(),
      notaryPublicKey: this.signer.publicKey(),
      notaryIsSignatory: true,
      tipPercentage: 0,
    };

    const notarizedTransaction: NotarizedTransaction =
      await TransactionBuilder.new().then((builder) =>
        builder
          .header(transactionHeader)
          .manifest(transaction.getManifest())
          .notarize(this.signer)
      );

    await RadixEngineToolkit.NotarizedTransaction.staticallyValidate(
      notarizedTransaction,
      defaultValidationConfig(this.networkId)
    ).then((validation) => {
      if (validation.kind === "Invalid") {
        throw new Error("Transaction is invalid");
      }
    });

    const transactionId =
      await RadixEngineToolkit.NotarizedTransaction.intentHash(
        notarizedTransaction
      );
    console.log(`Transaction ${transactionId.id} sent.`);

    const compiled =
      await RadixEngineToolkit.NotarizedTransaction.compile(
        notarizedTransaction
      );

    await this.apiClient.submitTransaction(compiled);

    return transactionId;
  }
}
