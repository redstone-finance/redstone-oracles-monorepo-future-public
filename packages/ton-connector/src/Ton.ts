import { Address, Cell, ContractProvider, Sender } from "@ton/core";
import { SendMode, TonClient, TonClient4 } from "@ton/ton";
import { TonNetwork } from "./network/TonNetwork";

export async function sleep(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

export abstract class Ton {
  sender!: Sender;
  api?: TonClient4;
  oldApi?: TonClient;
  walletAddress?: Address;

  async connect(network: TonNetwork): Promise<Ton> {
    await network.setUp();

    this.sender = network.sender!;
    this.api = network.api;
    this.oldApi = network.oldApi;
    this.walletAddress = network.walletAddress;

    if (!(await network.isContractDeployed(network.walletAddress))) {
      throw new Error("wallet is not deployed");
    }

    return this;
  }

  async internalMessage(
    provider: ContractProvider,
    coins: number,
    body?: Cell,
    sendMode = SendMode.PAY_GAS_SEPARATELY
  ) {
    return await provider.internal(this.sender, {
      value: `${coins.toFixed(2)}`,
      body,
      sendMode,
    });
  }
}
