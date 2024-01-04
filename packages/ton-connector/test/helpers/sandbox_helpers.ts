import { Blockchain, SendMessageResult } from "@ton/sandbox";
import { SandboxTonNetwork } from "./SandboxTonNetwork";

export async function createTestNetwork() {
  const blockchain = await Blockchain.create();
  const deployer = await blockchain.treasury("deployer");

  return new SandboxTonNetwork(deployer.getSender(), blockchain);
}

export function extractSandboxLogs(
  consumerResult: void | SendMessageResult,
  transactionIndex: number
) {
  return (consumerResult as SendMessageResult).transactions[
    transactionIndex
  ].debugLogs
    .split("\n")
    .map((log) => log.substring("#DEBUG#: s0 = ".length));
}
