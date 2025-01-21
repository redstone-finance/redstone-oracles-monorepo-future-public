import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PriceAdapter } from "../target/types/price_adapter";
import { ComputeBudgetProgram } from "@solana/web3.js";
import { expect } from "chai";
import {
  printComputeUnitsUsed,
  makePriceSeed,
  makeFeedIdBytes,
} from "./util";
import { PRIMARY_SIGNERS } from "./signers";

/**
 * the cases below are for debugging mainly, the real e2e runs through all of the
 * possible feed IDs and can be found in `redstone-sol.ts` test file
 */
describe.skip("redstone-sol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PriceAdapter as Program<PriceAdapter>;

  const feedId = "BTC";

  let priceAccount: anchor.web3.PublicKey;

  let configAccount: anchor.web3.PublicKey;

  const systemProgram = anchor.web3.SystemProgram.programId;

  before(async () => {
    priceAccount = anchor.web3.PublicKey.findProgramAddressSync(
      [makePriceSeed(), makeFeedIdBytes(feedId)],
      program.programId
    )[0];

    configAccount = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    )[0];
  });

  it("initializes correctly", async () => {
    const tenYears = 60 * 60 * 24 * 365 * 10; // 10 years
    await program.methods
      .initialize(
        PRIMARY_SIGNERS,
        [],
        3, // signer_count_threshold
        new anchor.BN(tenYears), 
        new anchor.BN(tenYears),
        new anchor.BN(1_000) // 1 second,
      )
      .accountsStrict({
        owner: anchor.getProvider().publicKey,
        systemProgram,
        configAccount,
      })
      .rpc();

    console.log("Config initialized at:", configAccount.toString());
  });

  it(`Updates correctly for BTC feed`, async () => {
    const payload = [
      66, 84, 67, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 58, 182, 116, 104, 177, 1, 146, 170, 223,
      139, 176, 0, 0, 0, 32, 0, 0, 1, 43, 218, 184, 99, 113, 194, 156, 200, 231,
      35, 84, 134, 87, 215, 8, 159, 159, 138, 105, 210, 213, 205, 124, 73, 234,
      227, 40, 9, 226, 13, 146, 163, 92, 252, 93, 106, 169, 6, 115, 168, 226,
      166, 112, 111, 90, 237, 27, 253, 190, 225, 47, 16, 208, 114, 14, 12, 235,
      44, 110, 244, 188, 96, 6, 91, 28, 66, 84, 67, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 58, 182,
      116, 104, 177, 1, 146, 170, 223, 139, 176, 0, 0, 0, 32, 0, 0, 1, 143, 215,
      175, 236, 103, 162, 86, 18, 42, 103, 87, 163, 21, 179, 144, 222, 90, 247,
      211, 241, 62, 242, 230, 233, 83, 191, 182, 114, 36, 143, 211, 94, 101, 30,
      185, 70, 46, 86, 232, 98, 31, 250, 231, 52, 221, 240, 205, 18, 253, 240,
      185, 77, 77, 238, 224, 181, 19, 123, 123, 165, 5, 160, 214, 87, 28, 66,
      84, 67, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 6, 58, 182, 131, 169, 123, 1, 146, 170, 223, 139,
      176, 0, 0, 0, 32, 0, 0, 1, 177, 208, 87, 179, 126, 42, 24, 134, 220, 94,
      31, 20, 23, 243, 240, 182, 150, 195, 62, 93, 178, 128, 110, 81, 78, 111,
      213, 245, 165, 208, 42, 154, 46, 93, 3, 148, 58, 109, 254, 91, 37, 223,
      99, 96, 105, 2, 113, 158, 31, 135, 46, 69, 135, 94, 17, 144, 2, 128, 255,
      253, 252, 53, 221, 89, 27, 0, 3, 0, 0, 0, 0, 0, 2, 237, 87, 1, 30, 0, 0,
    ];

    const feedIdBytes = makeFeedIdBytes(feedId);
    const tx = await program.methods
      .processRedstonePayload(Array.from(feedIdBytes), Buffer.from(payload))
      .preInstructions([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
      ])
      .accountsStrict({
        user: provider.wallet.publicKey,
        priceAccount,
        configAccount,
        systemProgram,
      })
      .rpc({ skipPreflight: true });

    await printComputeUnitsUsed(provider, tx);

    const priceAccountData = await program.account.priceData.fetch(priceAccount);

    expect(priceAccountData.feedId).to.equal(feedId);
    expect(priceAccountData.value).to.not.equal("0");

    console.log(`${feedId}: ${JSON.stringify(priceAccountData)}`);
  });
});
