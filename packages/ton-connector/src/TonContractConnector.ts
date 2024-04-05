import { IContractConnector } from "@redstone-finance/sdk";
import { hexlify } from "ethers/lib/utils";
import { sleep } from "./Ton";
import { TonContract } from "./TonContract";
import { TonContractFactory } from "./TonContractFactory";
import { AnyTonOpenedContract, TonNetwork } from "./network/TonNetwork";

export abstract class TonContractConnector<
  Contract extends TonContract,
  Adapter,
> implements IContractConnector<Adapter>
{
  protected constructor(
    protected contractType: typeof TonContract,
    protected network: TonNetwork,
    private address?: string
  ) {}

  async makeContract(
    contractFactory: TonContractFactory
  ): Promise<TonContract> {
    return await contractFactory.makeForExecute(this.network, this.address!);
  }

  async getContract(): Promise<AnyTonOpenedContract<Contract>> {
    const contractFactory = new TonContractFactory(this.contractType);
    const contract = await this.makeContract(contractFactory);

    return this.network.open(contract as Contract);
  }

  abstract getAdapter(): Promise<Adapter>;

  async getBlockNumber(): Promise<number> {
    return (await this.network.api!.getLastBlock()).last.seqno;
  }

  async waitForTransaction(_: string): Promise<boolean> {
    const { hash } = await this.fetchNetworkValues();
    let transactionId: string | undefined;
    let totalFees: number | undefined;

    let currentHash = hash;
    while (hash == currentHash) {
      console.log(`Waiting for contract changes...`);
      await sleep(1500);

      ({
        hash: currentHash,
        transactionId,
        totalFees,
      } = await this.fetchNetworkValues());
    }

    console.log(
      `Contract changed with transaction: '${transactionId}'; totalFees: ${totalFees} TONs`
    );

    return true;
  }

  private async fetchNetworkValues() {
    const api = this.network.api;
    const walletAddress = this.network.walletAddress;

    if (!api || !walletAddress) {
      throw new Error("Api or Wallet address is undefined");
    }

    const seqno = (await api.getLastBlock()).last.seqno;
    const account = await api.getAccountLite(seqno, walletAddress);
    const hash = account.account.last!.hash;
    const transactions = await api.getAccountTransactions(
      walletAddress,
      BigInt(account.account.last!.lt),
      Buffer.from(hash, "base64")
    );

    const lastTransaction = transactions[0].tx;

    const transactionId = hexlify(lastTransaction.hash()).substring(2);

    return {
      seqno,
      hash,
      transactionId,
      totalFees: Number(lastTransaction.totalFees.coins) / 10 ** 9,
    };
  }
}
