import { ChildProcess } from "child_process";
import {
  runWithLogPrefixInBackground,
  stopChild,
  waitForUrl,
} from "./integration-test-utils";

export type HardhatInstance = {
  hardhatProcess?: ChildProcess;
  instanceId: string;
  url?: string;
};

export type HardhatConfig = {
  port?: number;
};

const DEFAULT_CONFIG: Partial<HardhatConfig> = {
  port: 8545,
};

const RELAYER_DIR = "../on-chain-relayer";

export const startAndWaitForHardHat = async (
  instance: HardhatInstance,
  hardhatConfig: HardhatConfig = {}
): Promise<void> => {
  const { port } = {
    ...DEFAULT_CONFIG,
    ...hardhatConfig,
  } as Required<HardhatConfig>;

  instance.hardhatProcess = runWithLogPrefixInBackground(
    "yarn",
    ["start-node", "--port", port.toString()],
    `hardhat-${instance.instanceId}`,
    RELAYER_DIR
  );
  instance.url = `http://127.0.0.1:${port}`;
  await waitForUrl(instance.url); // wait for hardhat to start blockchain instance
};

export const stopHardhat = (hardhat: HardhatInstance) => {
  stopChild(hardhat.hardhatProcess, `hardhat-node-${hardhat.instanceId}`);
};
