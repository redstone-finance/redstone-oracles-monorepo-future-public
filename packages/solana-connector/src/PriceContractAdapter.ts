import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import idl from "../solana/target/idl/price_adapter.json";
import { PriceAdapter } from "../solana/target/types/price_adapter";
import { ConfigAccount, PriceData } from "./types";

export class PriceAdapterContract {
  readonly program: Program<PriceAdapter>;

  constructor(connection: Connection) {
    this.program = new Program(idl as PriceAdapter, {
      connection,
    });
  }

  public getConfigAccount(): anchor.web3.PublicKey {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      this.program.programId
    )[0];
  }

  public getPriceDataAccount(feedId: string): anchor.web3.PublicKey {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [makePriceSeed(), makeFeedIdBytes(feedId)],
      this.program.programId
    )[0];
  }

  public getConfig(): Promise<ConfigAccount> {
    const address = this.getConfigAccount();

    return this.program.account.configAccount.fetch(address);
  }

  public getPriceData(feedId: string): Promise<PriceData> {
    const address = this.getPriceDataAccount(feedId);

    return this.program.account.priceData.fetch(address);
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
        configAccount: this.getConfigAccount(),
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .instruction();
  }

  public async initialize(
    owner: PublicKey,
    signers: number[][],
    trusted_updaters: anchor.web3.PublicKey[],
    threshold: number,
    max_timestamp_delay_ms: number,
    max_timestamp_ahead_ms: number,
    min_interval_between_updates_ms: number
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .initialize(
        signers,
        trusted_updaters,
        threshold,
        new anchor.BN(max_timestamp_delay_ms),
        new anchor.BN(max_timestamp_ahead_ms),
        new anchor.BN(min_interval_between_updates_ms)
      )
      .accountsStrict({
        owner,
        systemProgram: anchor.web3.SystemProgram.programId,
        configAccount: this.getConfigAccount(),
      })
      .instruction();
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
