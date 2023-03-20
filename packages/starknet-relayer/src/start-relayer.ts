import { config } from "./config";
import { Starknet } from "./starknet/Starknet";
import { FEE_MULTIPLIER } from "./starknet/StarknetCommand";

(() => {
  const relayerIterationInterval = Number(config.relayerIterationInterval);
  const updatePriceInterval = Number(config.updatePriceInterval);
  const starknet = new Starknet(config);

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
      const timestampAndRound = await starknet
        .readTimestampAndRoundCommand()
        .execute();

      const currentTimestamp = Date.now();
      let timestampDelta = currentTimestamp - timestampAndRound.payload_timestamp;
      const isEnoughTimeElapsedSinceLastUpdate =
        timestampDelta >= updatePriceInterval;
      if (!isEnoughTimeElapsedSinceLastUpdate) {
        return console.log(
          `Skipping, because not enough time has passed to update prices (${
            timestampDelta / 1000
          } s.)`
        );
      }

      txHash = await starknet
        .writePricesCommand(timestampAndRound.round + 1)
        .execute();
      console.log(`Started updating prices with transaction: ${txHash}`);
      pendingTransactionHash = txHash;
      console.log(`Waiting for the transaction's status changes...`);

      const result = await starknet.waitForTransaction(txHash!);
      console.log(
        `Transaction ${txHash} finished with status: ${result.status}, fee: ${
          result.actual_fee != undefined
            ? parseInt(result.actual_fee) / FEE_MULTIPLIER
            : result.actual_fee
        } ETH, data: ${result.status_data}`
      );
    } catch (error: any) {
      console.log(error.stack);
    } finally {
      if (pendingTransactionHash === txHash) {
        pendingTransactionHash = undefined;
      }
    }
  }, relayerIterationInterval);
})();
