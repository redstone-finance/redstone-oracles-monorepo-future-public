import { SendMode, TonClient, TonClient4 } from "ton";
import { Cell, ContractProvider, Sender } from "ton-core";
import { TonNetwork } from "./network/TonNetwork";

export async function sleep(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

export abstract class Ton {
  sender!: Sender;
  api: TonClient4 | undefined;
  oldApi: TonClient | undefined;

  async connect(network: TonNetwork): Promise<Ton> {
    await network.setUp();

    this.sender = network.sender!;
    this.api = network.api;
    this.oldApi = network.oldApi;

    const walletAddress = this.sender.address;
    if (!(await network.isContractDeployed(walletAddress))) {
      throw "wallet is not deployed";
    }

    return this;
  }

  async internalMessage(
    provider: ContractProvider,
    coins: number,
    body?: Cell,
    sendMode = SendMode.PAY_GAS_SEPARATELY
  ): Promise<void> {
    await this.wait(async () => {
      await provider.internal(this.sender, {
        value: `${coins.toFixed(2)}`,
        body,
        sendMode,
      });
    });
  }

  protected async wait<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.api) {
      return await callback();
    }

    const seqno = (await this.api.getLastBlock()).last.seqno;

    const result = await callback();

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
      console.log("waiting for transaction to confirm...");
      await sleep(1500);
      currentSeqno = (await this.api.getLastBlock()).last.seqno;
    }

    console.log("transaction confirmed!");

    return result;
  }
}
