import { ChildProcess } from "child_process";
import {
  runWithLogPrefixInBackground,
  stopChild,
  waitForUrl,
} from "./integration-test-utils";

export type HardhatInstance = {
  hardhatProcess?: ChildProcess;
  instanceId: string;
};

const RELAYER_DIR = "../on-chain-relayer";

export const startAndWaitForHardHat = async (
  instance: HardhatInstance
): Promise<void> => {
  instance.hardhatProcess = runWithLogPrefixInBackground(
    "yarn",
    ["start-node"],
    `hardhat-${instance.instanceId}`,
    RELAYER_DIR
  );
  await waitForUrl("127.0.0.1:8545"); // wait for hardhat to start blockchain instance
};

export const stopHardhat = (hardhat: HardhatInstance) => {
  stopChild(hardhat.hardhatProcess, `hardhat-node-${hardhat.instanceId}`);
};
