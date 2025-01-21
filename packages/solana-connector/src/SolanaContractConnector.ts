import {
  IContractConnector,
  IPricesContractAdapter,
} from "@redstone-finance/sdk";
import { Connection, Keypair } from "@solana/web3.js";
import { SolanaPricesContractAdapter } from "./prices/SolanaPricesContractAdapter";

export class SolanaContractConnector
  implements IContractConnector<IPricesContractAdapter>
{
  constructor(
    readonly connection: Connection,
    readonly keypair: Keypair
  ) {}

  getAdapter(): Promise<SolanaPricesContractAdapter> {
    return Promise.resolve(
      new SolanaPricesContractAdapter(this.connection, this.keypair)
    );
  }

  getBlockNumber(): Promise<number> {
    return this.connection.getBlockHeight();
  }

  async waitForTransaction(txId: string): Promise<boolean> {
    const latestBlockHash = await this.connection.getLatestBlockhash();

    const x = await this.connection.confirmTransaction(
      {
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txId,
      },
      "confirmed"
    );

    return x.value.err === null;
  }
}
