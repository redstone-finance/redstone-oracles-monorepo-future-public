import { ChildProcess } from "child_process";
import {
  runWithLogPrefixInBackground,
  stopChild,
  waitForUrl,
} from "./integration-test-utils";
import {
  compileRelayerContracts,
  lazilyInstallNPMDeps,
} from "./integration-test-compile";

export type HardhatInstance = {
  hardhatProcess?: ChildProcess;
  instanceId: string;
};

export const startAndWaitForHardHat = async (
  instance: HardhatInstance
): Promise<void> => {
  process.chdir("../on-chain-relayer");
  await lazilyInstallNPMDeps();
  await compileRelayerContracts();
  instance.hardhatProcess = runWithLogPrefixInBackground(
    "yarn",
    ["start-node"],
    `hardhat-${instance.instanceId}`
  );
  await waitForUrl("127.0.0.1:8545"); // wait for hardhat to start blockchain instance
};

export const stopHardhat = (hardhat: HardhatInstance | undefined) => {
  stopChild(hardhat?.hardhatProcess, `hardhat node-${hardhat?.instanceId}`);
};
