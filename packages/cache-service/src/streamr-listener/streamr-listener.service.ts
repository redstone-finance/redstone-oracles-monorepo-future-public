import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { getOracleRegistryState } from "redstone-sdk";
import { StreamrClient, Subscription } from "streamr-client";
import { DataPackage } from "../data-packages/data-packages.model";
import { DataPackagesService } from "../data-packages/data-packages.service";

interface StreamrSubscriptions {
  [nodeEvmAddress: string]: Subscription;
}

const CRON_EXPRESSION_EVERY_1_MINUTE = "*/1 * * * *";

@Injectable()
export class StreamrListenerService {
  private subscriptionsState: StreamrSubscriptions = {};
  private streamrClient: StreamrClient = new StreamrClient();

  constructor(private dataPackageService: DataPackagesService) {}

  @Cron(CRON_EXPRESSION_EVERY_1_MINUTE)
  handleCron() {
    this.syncStreamrListening();
  }

  async syncStreamrListening() {
    console.log(`Syncing streamr listening`);
    const oracleRegistryState = await getOracleRegistryState();
    const nodeEvmAddresses = Object.values(oracleRegistryState.nodes).map(
      ({ evmAddress }) => evmAddress
    );

    // Start listening to new nodes' streams
    for (const nodeEvmAddress of nodeEvmAddresses) {
      if (this.subscriptionsState[nodeEvmAddress] === undefined) {
        this.listenToNodeStream(nodeEvmAddress);
      }
    }

    // Stop listening to removed nodes' streams
    for (const subscribedNodeEvmAddress of Object.keys(
      this.subscriptionsState
    )) {
      const nodeIsRegistered = nodeEvmAddresses.some(
        (address) =>
          address.toLowerCase() === subscribedNodeEvmAddress.toLowerCase()
      );
      if (!nodeIsRegistered) {
        this.cancelListeningToNodeStream(subscribedNodeEvmAddress);
      }
    }
  }

  async listenToNodeStream(nodeEvmAddress: string) {
    // TODO: move the logic of stream id creation to redstone-sdk
    const streamId = `${nodeEvmAddress}/redstone-oracles`;

    const subscription = await this.streamrClient.subscribe(
      streamId,
      async (message: string) => {
        try {
          const dataPackagesToSave =
            await this.dataPackageService.prepareReceivedDataPackagesForBulkSaving(
              JSON.parse(message),
              nodeEvmAddress
            );
          console.log(`Data packages parsed for node: ${nodeEvmAddress}`);
          await DataPackage.insertMany(dataPackagesToSave);
          console.log(
            `Saved ${dataPackagesToSave.length} data packages for node: ${nodeEvmAddress}`
          );
        } catch (e) {
          console.error(e);
        }
      }
    );
    this.subscriptionsState[nodeEvmAddress] = subscription;
  }

  cancelListeningToNodeStream(nodeEvmAddress: string) {
    const subscription = this.subscriptionsState[nodeEvmAddress];
    if (!!subscription) {
      delete this.subscriptionsState[nodeEvmAddress];
      this.streamrClient.unsubscribe(subscription);
    }
  }
}
