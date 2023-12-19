import { Blockchain, SendMessageResult } from "@ton/sandbox";
import { SandboxTonNetwork } from "./SandboxTonNetwork";

export async function createTestNetwork() {
  const blockchain = await Blockchain.create();
  const deployer = await blockchain.treasury("deployer");

  return new SandboxTonNetwork(deployer.getSender(), blockchain);
}

export function extractSandboxLogs(
  consumerResult: void | SendMessageResult,
  transactionId: number
) {
  const logs = (consumerResult as SendMessageResult).transactions[
    transactionId
  ].debugLogs
    .split("\n")
    .map((log) => log.substring("#DEBUG#: s0 = ".length));
  return logs;
}
