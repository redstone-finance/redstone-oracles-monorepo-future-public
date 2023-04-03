import { config } from "./config";
import { StarknetPriceManagerContractConnector } from "./starknet/StarknetPriceManagerContractConnector";

(async () => {
  const relayerIterationInterval = Number(config.relayerIterationInterval);
  const updatePriceInterval = Number(config.updatePriceInterval);
  const starknet = new StarknetPriceManagerContractConnector(config);
  const adapter = await starknet.getAdapter();

  let pendingTransactionHash: string | undefined;

  console.log(
    `Starting contract prices updater with interval ${
      relayerIterationInterval / 1000
    } s.`
  );

  setInterval(async () => {
    let txHash: string | undefined;

    try {
      if (pendingTransactionHash != undefined) {
        return console.log(
          `Skipping, because there exists a pending transaction: ${pendingTransactionHash}`
        );
      }
      const timestampAndRound = await adapter.readTimestampAndRound();

      const currentTimestamp = Date.now();
      let timestampDelta =
        currentTimestamp - timestampAndRound.payload_timestamp;
      const isEnoughTimeElapsedSinceLastUpdate =
        timestampDelta >= updatePriceInterval;
      if (!isEnoughTimeElapsedSinceLastUpdate) {
        return console.log(
          `Skipping, because not enough time has passed to update prices (${
            timestampDelta / 1000
          } s.)`
        );
      }

      pendingTransactionHash = "...";
      txHash = await adapter.writePrices(timestampAndRound.round + 1);
      console.log(`Started updating prices with transaction: ${txHash}`);
      pendingTransactionHash = txHash;
      console.log(`Waiting for the transaction's status changes...`);
      await starknet.waitForTransaction(txHash!);
    } catch (error: any) {
      console.log(error.stack || error);
    } finally {
      if (pendingTransactionHash === txHash) {
        pendingTransactionHash = undefined;
      }
    }
  }, relayerIterationInterval);
})();
