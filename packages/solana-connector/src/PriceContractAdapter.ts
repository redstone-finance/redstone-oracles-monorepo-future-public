import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import idl from "../solana/target/idl/price_adapter.json";
import { PriceAdapter } from "../solana/target/types/price_adapter";
import { PriceData } from "./types";

export class PriceAdapterContract {
  readonly program: Program<PriceAdapter>;

  constructor(connection: Connection, keypair: Keypair) {
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(keypair)
    );
    this.program = new Program(idl as PriceAdapter, provider);
  }

  public getPriceDataAccount(feedId: string): anchor.web3.PublicKey {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [makePriceSeed(), makeFeedIdBytes(feedId)],
      this.program.programId
    )[0];
  }

  public getPriceData(feedId: string): Promise<PriceData> {
    const address = this.getPriceDataAccount(feedId);

    return this.program.account.priceData.fetch(address, "processed");
  }

  public async writePriceIx(
    user: PublicKey,
    feedId: string,
    payload: string
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .writePrice(
        Array.from(makeFeedIdBytes(feedId)),
        Buffer.from(JSON.parse(payload) as number[])
      )
      .accountsStrict({
        user,
        priceAccount: this.getPriceDataAccount(feedId),
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .instruction();
  }

  public async getUniqueSignerThreshold(): Promise<number> {
    return (await this.program.methods.uniqueSignersCount().view()) as number;
  }
}

export function connectionTo(apiUrl: string): Connection {
  return new Connection(apiUrl);
}

export const makeFeedIdBytes = (feedId: string) => {
  return Buffer.from(feedId.padEnd(32, "\0"));
};

export const makePriceSeed = () => {
  return Buffer.from("price".padEnd(32, "\0"));
};
