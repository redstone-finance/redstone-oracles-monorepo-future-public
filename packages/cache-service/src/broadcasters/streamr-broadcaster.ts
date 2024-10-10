import { Injectable, Logger } from "@nestjs/common";
import { SignedDataPackagePlainObj } from "@redstone-finance/protocol";
import { RedstoneCommon } from "@redstone-finance/utils";
import { Wallet, providers, utils } from "ethers";
import {
  StreamPermission,
  StreamrClient,
  compressMsg,
  doesStreamExist,
  getStreamIdForNodeByEvmAddress,
} from "../common/streamr";
import config from "../config";
import { CachedDataPackage } from "../data-packages/data-packages.model";
import { DataPackagesBroadcaster } from "./data-packages-broadcaster";

const POLYGON_RPC = {
  name: "Polygon",
  rpc: "https://polygon-rpc.com",
  chainId: 137,
};
const MINIMAL_MATIC_BALANCE = "0.1";
const STORAGE_DAYS = 7;
const INACTIVITY_THRESHOLD_HOURS = 24 * 20; // 20 days

@Injectable()
export class StreamrBroadcaster implements DataPackagesBroadcaster {
  private readonly streamrClient: StreamrClient;
  private readonly address: string;
  private streamExistsCached: boolean = false;
  private isStreamCreationRequested: boolean = false;
  private readonly logger = new Logger(StreamrBroadcaster.name);

  constructor() {
    const streamrPrivateKey = config.streamrPrivateKey;
    RedstoneCommon.assert(
      !!streamrPrivateKey,
      `Misconfiguration: Trying to create ${StreamrBroadcaster.name}, but STREAMR_PRIVATE_KEY is not defined`
    );

    this.streamrClient = new StreamrClient({
      auth: { privateKey: streamrPrivateKey },
      network: {
        webrtcDisallowPrivateAddresses: false,
      },
    });
    this.address = new Wallet(streamrPrivateKey).address;
  }

  async broadcast(
    dataPackages: CachedDataPackage[],
    nodeEvmAddress: string
  ): Promise<void> {
    const streamId = getStreamIdForNodeByEvmAddress(nodeEvmAddress);
    const dataToBroadcast: SignedDataPackagePlainObj[] = dataPackages.map(
      (dp) => ({
        timestampMilliseconds: dp.timestampMilliseconds,
        dataPoints: dp.dataPoints,
        signature: dp.signature,
        dataPackageId: dp.dataPackageId,
      })
    );

    const streamExists = await this.lazyCheckIfStreamExists(streamId);

    if (streamExists) {
      this.logger.log("Broadcasting data packages to streamr");
      await this.streamrClient.publish(
        {
          streamId: streamId,
        },
        compressMsg(dataToBroadcast)
      );
      this.logger.log(
        `New data published to the stream: ${this.address}/${streamId}`
      );
    } else {
      await this.tryToCreateStream(streamId);
    }
  }

  private async tryToCreateStream(streamId: string) {
    if (this.isStreamCreationRequested) {
      this.logger.log("Stream creation already requested, skipping");
      return;
    }

    this.isStreamCreationRequested = true;

    this.logger.log(
      `Trying to create new Streamr stream: ${this.address}/${streamId}`
    );

    await this.assertEnoughMaticBalance();

    await RedstoneCommon.retry({
      fn: () =>
        this.streamrClient.createStream({
          id: streamId,
          storageDays: STORAGE_DAYS,
          inactivityThresholdHours: INACTIVITY_THRESHOLD_HOURS,
        }),
      waitBetweenMs: 1_000,
      maxRetries: 10,
      backOff: {
        backOffBase: 2,
      },
      logger: this.logger.log.bind(this),
    })();

    this.logger.log(`Stream created: ${streamId}`);

    await RedstoneCommon.retry({
      fn: () =>
        this.streamrClient.grantPermissions(streamId, {
          public: true,
          permissions: [StreamPermission.SUBSCRIBE],
        }),
      waitBetweenMs: 1_000,
      maxRetries: 10,
      backOff: {
        backOffBase: 2,
      },
      logger: this.logger.log.bind(this),
    })();

    this.logger.log(
      `Added permissions to the stream: ${this.address}/${streamId}`
    );
    this.streamExistsCached = true;
  }

  private async lazyCheckIfStreamExists(streamId: string) {
    if (this.streamExistsCached) {
      return true;
    }
    return await doesStreamExist(this.streamrClient, streamId);
  }

  private async assertEnoughMaticBalance() {
    this.logger.log("Checking MATIC balance");
    const provider = new providers.JsonRpcProvider(POLYGON_RPC.rpc, {
      name: POLYGON_RPC.name,
      chainId: POLYGON_RPC.chainId,
    });
    const balance = await provider.getBalance(this.address);

    if (!balance.gte(utils.parseEther(MINIMAL_MATIC_BALANCE))) {
      throw new Error(
        `MATIC balance is too low for creating a new stream: ${utils.formatEther(
          balance
        )}`
      );
    }
  }
}
