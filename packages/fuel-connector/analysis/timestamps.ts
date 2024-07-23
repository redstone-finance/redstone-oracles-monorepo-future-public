import { FuelConnector } from "../src";

const RPC_URL = "https://testnet.fuel.network/v1/graphql";
const ITERATION_INTERVAL = 1000;

(() => {
  const fuel = new FuelConnector(RPC_URL);
  console.log(
    `Starting timestamp analysis with interval ${ITERATION_INTERVAL / 1000} s.`
  );

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setInterval(async () => {
    try {
      const subtrahend = BigInt(
        "0b100000000000000000000000000000000000000000000000000000000001010" // 2^62 + 10
      );

      const localTimestamp = new Date().getTime();
      const { time } = await fuel.getLatestBlock();
      const blockTime = BigInt(time);
      const blockTimestamp = Number(blockTime - subtrahend) * 1000;

      const timestampDelta = localTimestamp - blockTimestamp;

      console.log(
        `Successfully updated timestamps at ${localTimestamp} (delta: ${
          timestampDelta / 1000
        } s.)`
      );
    } catch (error) {
      console.log((error as Error).stack);
    }
  }, ITERATION_INTERVAL);
})();
