import { RedstoneCommon } from "@redstone-finance/utils";
import {
  GatewayInstance,
  HardhatInstance,
  OracleNodeInstance,
  RelayerInstance,
  configureCleanup,
  debug,
  deployMockAdapter,
  setMockPrices,
  startAndWaitForGateway,
  startAndWaitForHardHat,
  startAndWaitForOracleNode,
  startRelayer,
  stopGateway,
  stopHardhat,
  stopOracleNode,
  stopRelayer,
  waitForDataAndDisplayIt,
} from "../framework/integration-test-framework";

const hardhatInstance: HardhatInstance = { instanceId: "1" };
const relayerInstance: RelayerInstance = { instanceId: "1" };
const gatewayInstance: GatewayInstance = { instanceId: "1" };
const oracleNodeInstance: OracleNodeInstance = { instanceId: "1" };

const stopAll = () => {
  debug("stopAll called");
  stopRelayer(relayerInstance);
  stopHardhat(hardhatInstance);
  stopOracleNode(oracleNodeInstance);
  stopGateway(gatewayInstance);
};

const main = async () => {
  await startAndWaitForGateway(gatewayInstance, { directOnly: true });
  setMockPrices(
    {
      BTC: 16000,
      __DEFAULT__: 42,
    },
    oracleNodeInstance
  );
  await startAndWaitForOracleNode(oracleNodeInstance, [gatewayInstance]);
  await waitForDataAndDisplayIt(gatewayInstance);
  await startAndWaitForHardHat(hardhatInstance);

  const adapterContract = await deployMockAdapter();

  startRelayer(relayerInstance, {
    cacheServiceInstances: [gatewayInstance],
    adapterContractAddress: adapterContract.address,
    isFallback: false,
    // too low gas limit to fail simulation
    gasLimit: 1,
    sleepAfterFailedSimulation: 1,
  });

  await waitForRelayerExit(relayerInstance);

  process.exit();
};

const waitForRelayerExit = (relayerInstance: RelayerInstance) =>
  RedstoneCommon.timeout(
    new Promise((resolve, reject) => {
      relayerInstance.relayerProcess!.addListener("exit", (code) => {
        if (code === 0) {
          reject(
            new Error(
              "Relayer has exited with 0 exit code, but 1 was expected cause of simulation error"
            )
          );
        } else {
          resolve("");
        }
      });
    }),
    60_000,
    "Relayer has not exited after failed simulation"
  );

configureCleanup(stopAll);

void main();
