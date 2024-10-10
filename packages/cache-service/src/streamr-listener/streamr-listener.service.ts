import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { RedstoneOraclesState } from "@redstone-finance/oracles-smartweave-contracts";
import { getOracleRegistryState } from "@redstone-finance/sdk";
import {
  StreamrClient,
  Subscription,
  decompressMsg,
  doesStreamExist,
  getStreamIdForNodeByEvmAddress,
} from "../common/streamr";
import config from "../config";
import { ReceivedDataPackage } from "../data-packages/data-packages.interface";
import { DataPackagesService } from "../data-packages/data-packages.service";

interface StreamrSubscriptions {
  [nodeEvmAddress: string]: Subscription | undefined;
}

interface NodeLike {
  evmAddress: string;
  dataServiceId: string;
}

const CRON_EXPRESSION_EVERY_1_MINUTE = "*/1 * * * *";

@Injectable()
export class StreamrListenerService {
  private readonly logger = new Logger(StreamrListenerService.name);
  private readonly streamrClient: StreamrClient = new StreamrClient({
    network: {
      webrtcDisallowPrivateAddresses: false,
    },
  });
  private subscriptionsState: StreamrSubscriptions = {};

  constructor(private readonly dataPackageService: DataPackagesService) {}

  @Cron(CRON_EXPRESSION_EVERY_1_MINUTE)
  handleCron() {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.syncStreamrListening();
  }

  async syncStreamrListening() {
    this.logger.log(`Syncing streamr listening`);
    const oracleRegistryState = await getOracleRegistryState();
    const nodeEvmAddresses =
      this.prepareActiveNodeEvmAddresses(oracleRegistryState);

    // Start listening to new nodes' streams
    for (const nodeEvmAddress of nodeEvmAddresses) {
      if (this.subscriptionsState[nodeEvmAddress] === undefined) {
        await this.listenToNodeStream(nodeEvmAddress);
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
    const streamId = getStreamIdForNodeByEvmAddress(nodeEvmAddress);
    const streamExists = await doesStreamExist(this.streamrClient, streamId);

    if (!streamExists) {
      this.logger.log(`Stream does not exist. Skipping: ${streamId}`);
      return;
    }

    this.logger.log(`Stream exists. Connecting to: ${streamId}`);
    const subscription = await this.streamrClient.subscribe(
      streamId,
      async (message: unknown) => {
        try {
          this.logger.log(`Received a message from stream: ${streamId}`);
          const dataPackagesReceived = decompressMsg<ReceivedDataPackage[]>(
            message as Uint8Array
          );
          const dataPackagesToSave =
            await DataPackagesService.prepareReceivedDataPackagesForBulkSaving(
              dataPackagesReceived,
              nodeEvmAddress
            );
          this.logger.log(`Data packages parsed for node: ${nodeEvmAddress}`);

          await this.dataPackageService.broadcast(
            dataPackagesToSave,
            nodeEvmAddress
          );
        } catch (e) {
          this.logger.error("Error occured ", (e as Error).stack);
        }
      }
    );
    this.subscriptionsState[nodeEvmAddress] = subscription;
  }

  cancelListeningToNodeStream(nodeEvmAddress: string) {
    const subscription = this.subscriptionsState[nodeEvmAddress];
    if (subscription) {
      delete this.subscriptionsState[nodeEvmAddress];
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.streamrClient.unsubscribe(subscription);
    }
  }

  // The function is left here to have it mockable in tests.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  getAllowedDataServiceIds(): string[] {
    return config.allowedStreamrDataServiceIds;
  }

  private prepareActiveNodeEvmAddresses(
    oracleRegistryState: RedstoneOraclesState
  ): string[] {
    const nodes: NodeLike[] = Object.values(oracleRegistryState.nodes);
    this.logger.log(`Found ${nodes.length} node evm addresses`);

    const allowedDataServiceIds = this.getAllowedDataServiceIds();
    if (allowedDataServiceIds.length === 0) {
      this.logger.log(
        `Filter is empty - allowing all of the node evm addresses`
      );
      return nodes.map(({ evmAddress }) => evmAddress);
    }

    const result: string[] = [];

    for (const node of nodes) {
      if (allowedDataServiceIds.includes(node.dataServiceId)) {
        result.push(node.evmAddress);
      }
    }

    this.logger.log(
      `${result.length} of the node evm addresses remained after filtering them out`
    );

    return result;
  }
}
