import { Injectable, Logger } from "@nestjs/common";
import { SignedDataPackagePlainObj } from "@redstone-finance/protocol";
import {
  StreamPermission,
  StreamrClient,
  compressMsg,
  doesStreamExist,
  getStreamIdForNodeByEvmAddress,
} from "@redstone-finance/streamr-proxy";
import { Wallet, providers, utils } from "ethers";
import { CachedDataPackage } from "../data-packages/data-packages.model";
import { DataPackagesBroadcaster } from "./data-packages-broadcaster";
import config from "../config";
import { RedstoneCommon } from "@redstone-finance/utils";

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
  private readonly streamId: string;
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
      auth: { privateKey: streamrPrivateKey! },
      network: {
        webrtcDisallowPrivateAddresses: false,
      },
    });
    this.address = new Wallet(streamrPrivateKey!).address;
    this.streamId = getStreamIdForNodeByEvmAddress(this.address);
  }

  async broadcast(
    dataPackages: CachedDataPackage[],
    nodeEvmAddress: string
  ): Promise<void> {
    const message = `broadcast ${dataPackages.length} data packages for node ${nodeEvmAddress}`;

    await this.performBroadcast(dataPackages)
      .then((result) => {
        this.logger.log(
          `[${StreamrBroadcaster.name}] succeeded to ${message}.`
        );
        return result;
      })
      .catch((error) => {
        this.logger.error(
          `[${
            StreamrBroadcaster.name
          }] failed to ${message}. ${RedstoneCommon.stringifyError(error)}`
        );
        throw error;
      });
  }

  async performBroadcast(dataPackages: CachedDataPackage[]): Promise<void> {
    const dataToBroadcast: SignedDataPackagePlainObj[] = dataPackages.map(
      (dp) => ({
        timestampMilliseconds: dp.timestampMilliseconds,
        dataPoints: dp.dataPoints,
        signature: dp.signature,
      })
    );

    const streamExists = await this.lazyCheckIfStreamExists();
    if (streamExists) {
      this.logger.log("Broadcasting data packages to streamr");
      await this.streamrClient.publish(
        {
          streamId: this.streamId,
        },
        compressMsg(dataToBroadcast)
      );
      this.logger.log(`New data published to the stream: ${this.streamId}`);
    } else {
      await this.tryToCreateStream();
    }
  }

  private async tryToCreateStream() {
    if (this.isStreamCreationRequested) {
      this.logger.log("Stream creation already requested, skipping");
      return;
    }

    this.logger.log(`Trying to create new Streamr stream: ${this.streamId}`);

    await this.assertEnoughMaticBalance();

    // Creating a stream
    const stream = await this.streamrClient.createStream({
      id: this.streamId,
      storageDays: STORAGE_DAYS,
      inactivityThresholdHours: INACTIVITY_THRESHOLD_HOURS,
    });
    this.isStreamCreationRequested = true;
    this.logger.log(`Stream created: ${this.streamId}`);

    // Adding permissions
    await stream.grantPermissions({
      public: true,
      permissions: [StreamPermission.SUBSCRIBE],
    });
    this.logger.log(`Added permissions to the stream: ${stream.id}`);
  }

  private async lazyCheckIfStreamExists() {
    if (this.streamExistsCached) {
      return true;
    }
    return await doesStreamExist(this.streamrClient, this.streamId);
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
