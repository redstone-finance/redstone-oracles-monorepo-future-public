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
import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";
import { RadixApiClient } from "./RadixApiClient";
import { RadixInvocation } from "./RadixInvocation";
import { RadixTransaction } from "./RadixTransaction";

const ALLOWED_FORWARD_EPOCH_COUNT = 100;

export class RadixClient {
  protected readonly logger = loggerFactory("RadixClient");
  protected readonly signer?: PrivateKey;
  protected readonly apiClient: RadixApiClient;

  constructor(
    protected networkId = NetworkId.Stokenet,
    privateKey?: { ed25519?: string; secp256k1?: string },
    applicationName = "RedStone Radix Connector"
  ) {
    this.signer = RadixClient.makeSigner(privateKey);
    this.apiClient = new RadixApiClient(applicationName, networkId);
  }

  static makeSigner(privateKey?: { ed25519?: string; secp256k1?: string }) {
    if (privateKey?.ed25519) {
      return new PrivateKey.Ed25519(privateKey.ed25519);
    }

    if (privateKey?.secp256k1) {
      return new PrivateKey.Secp256k1(privateKey.secp256k1);
    }

    return undefined;
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
    try {
      return await this.performWaitingForCommit(
        transactionId,
        pollDelayMs,
        pollAttempts
      );
    } catch (e) {
      this.logger.error(e);

      return false;
    }
  }

  private async performWaitingForCommit(
    transactionId: string,
    pollDelayMs: number,
    pollAttempts: number
  ) {
    for (let i = 0; i < pollAttempts; i++) {
      const statusOutput =
        await this.apiClient.getTransactionStatus(transactionId);
      const logMessage = `Transaction ${transactionId} is ${statusOutput.intent_status}`;
      switch (statusOutput.intent_status) {
        case "Pending":
        case "CommitPendingOutcomeUnknown": {
          this.logger.debug(logMessage);
          break;
        }
        case "CommittedSuccess": {
          this.logger.log(logMessage);
          return true;
        }
        case "CommittedFailure":
          throw new Error(
            `Transaction ${transactionId} failed: ${statusOutput.error_message}`
          );
        default:
          this.logger.log(logMessage);
      }
      await RedstoneCommon.sleep(pollDelayMs);
    }

    throw new Error(
      `Transaction ${transactionId} was not committed during ${pollDelayMs * pollAttempts} [ms]`
    );
  }

  protected async getAccountAddress() {
    return await RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(
      this.getPublicKey(),
      this.networkId
    );
  }

  protected getPublicKey() {
    if (!this.signer) {
      throw new Error("No signer or private key passed");
    }

    return this.signer.publicKey();
  }

  private async callTransaction(transaction: RadixTransaction) {
    const currentEpochNumber = await this.apiClient.getCurrentEpochNumber();
    const transactionHeader: TransactionHeader = {
      networkId: this.networkId,
      startEpochInclusive: currentEpochNumber,
      endEpochExclusive: currentEpochNumber + ALLOWED_FORWARD_EPOCH_COUNT,
      nonce: generateRandomNonce(),
      notaryPublicKey: this.getPublicKey(),
      notaryIsSignatory: true,
      tipPercentage: 0,
    };

    const notarizedTransaction: NotarizedTransaction =
      await TransactionBuilder.new().then((builder) =>
        builder
          .header(transactionHeader)
          .manifest(transaction.getManifest())
          .notarize(this.signer!)
      );

    await RadixEngineToolkit.NotarizedTransaction.staticallyValidate(
      notarizedTransaction,
      defaultValidationConfig(this.networkId)
    ).then((validation) => {
      if (validation.kind === "Invalid") {
        throw new Error(
          `Transaction is invalid: ${RedstoneCommon.stringifyError(validation.error)}`
        );
      }
    });

    const transactionId =
      await RadixEngineToolkit.NotarizedTransaction.intentHash(
        notarizedTransaction
      );
    this.logger.log(`Transaction ${transactionId.id} sent.`);

    const compiled =
      await RadixEngineToolkit.NotarizedTransaction.compile(
        notarizedTransaction
      );

    await this.apiClient.submitTransaction(compiled);

    return transactionId;
  }
}
