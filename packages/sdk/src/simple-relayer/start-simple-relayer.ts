import { sendHealthcheckPing } from "@redstone-finance/utils";
import { IContractConnector } from "../contracts/IContractConnector";
import { IPriceManagerContractAdapter } from "./IPriceManagerContractAdapter";

export async function startSimpleRelayer(
  config: {
    relayerIterationInterval: string | number;
    updatePriceInterval: string | number;
    healthcheckPingUrl?: string;
  },
  connector: IContractConnector<IPriceManagerContractAdapter>
) {
  const relayerIterationInterval = Number(config.relayerIterationInterval);
  const updatePriceInterval = Number(config.updatePriceInterval);

  const adapter = await connector.getAdapter();

  let pendingTransactionHash: string | undefined;

  console.log(
    `Starting contract prices updater with interval ${
      relayerIterationInterval / 1000
    } s.`
  );

  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- We've decided to allow the exception for setInterval
  setInterval(async () => {
    {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      sendHealthcheckPing(config.healthcheckPingUrl);

      let txHash: string | undefined;

      try {
        if (pendingTransactionHash != undefined) {
          return console.log(
            `Skipping, because there exists a pending transaction: ${pendingTransactionHash}`
          );
        }
        const timestampAndRound = await adapter.readTimestampAndRound();

        const currentTimestamp = Date.now();
        const timestampDelta =
          currentTimestamp - timestampAndRound.payload_timestamp;
        const isEnoughTimeElapsedSinceLastUpdate =
          timestampDelta >= updatePriceInterval;
        if (!isEnoughTimeElapsedSinceLastUpdate) {
          return console.log(
            `Skipping, because not enough time has passed to update prices (${
              timestampDelta / 1000
            } s. of ${updatePriceInterval / 1000} s.)`
          );
        }

        const round = timestampAndRound.round ?? -1;
        pendingTransactionHash = "...";
        txHash = await adapter.writePrices(round + 1);
        console.log(
          `Started updating prices (round: ${
            round + 1
          }) with transaction: ${txHash}`
        );
        pendingTransactionHash = txHash;
        console.log(`Waiting for the transaction's status changes...`);
        await connector.waitForTransaction(txHash);
      } catch (error) {
        console.error((error as Error).stack || error);
      } finally {
        if (
          pendingTransactionHash === txHash ||
          pendingTransactionHash === "..."
        ) {
          pendingTransactionHash = undefined;
        }
      }
    }
  }, relayerIterationInterval);
}
