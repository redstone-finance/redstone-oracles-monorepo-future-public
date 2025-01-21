import * as anchor from "@coral-xyz/anchor";
import { Program, ProgramError } from "@coral-xyz/anchor";
import { PriceAdapter } from "../target/types/price_adapter";
import { expect } from "chai";
import {
  printComputeUnitsUsed,
  makePayload,
  makePriceSeed,
  makeFeedIdBytes,
} from "./util";
import { PRIMARY_SIGNERS } from "./signers";

describe("redstone-sol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PriceAdapter as Program<PriceAdapter>;

  const feedIds = [
    "AVAX",
    "BTC",
    "CRV",
    "DAI",
    "ETH",
    "EUROC",
    "LINK",
    "SOL",
    "USDC",
    "USDT",
    "EUR",
  ];

  let pdas: { [id: string] : anchor.web3.PublicKey } = {};

  let configAccount: anchor.web3.PublicKey;

  const systemProgram = anchor.web3.SystemProgram.programId;

  before(async () => {
    for (const feedId of feedIds) {
      pdas[feedId] = anchor.web3.PublicKey.findProgramAddressSync(
        [makePriceSeed(), makeFeedIdBytes(feedId)],
        program.programId
      )[0];
    }

    configAccount = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    )[0];
  });

  it("initializes correctly", async () => {
    await program.methods
      .initialize(
        PRIMARY_SIGNERS,
        [],
        3, // signer_count_threshold
        new anchor.BN(15 * 60 * 1000), // max_timestamp_delay_ms (15 minutes)
        new anchor.BN(3 * 60 * 1000), // max_timestamp_ahead_ms (3 minutes)
        new anchor.BN(1_000), // 1 second
      )
      .accountsStrict({
        owner: anchor.getProvider().publicKey,
        systemProgram,
        configAccount,
      })
      .rpc();

    console.log("Config initialized at:", configAccount.toString());
  });

  async function testFeedIdPush(feedId: string) {
    it(`Updates correctly for ${feedId} feed`, async () => {
      const payload = await makePayload([feedId]);
      const feedIdBytes = makeFeedIdBytes(feedId);
      const priceAccount = pdas[feedId];
      const tx = await program.methods
        .writePrice(Array.from(feedIdBytes), payload)
        .accountsStrict({
          user: provider.wallet.publicKey,
          priceAccount,
          configAccount,
          systemProgram,
        })
        .rpc({ skipPreflight: false });

      await printComputeUnitsUsed(provider, tx);

      const priceAccountData = await program.account.priceData.fetch(priceAccount);

      expect(Buffer.from(priceAccountData.feedId).toString("utf8").replace(/\0+$/, "")).to.equal(feedId);
      expect(priceAccountData.value).to.not.equal("0");

      console.log(`${feedId}: ${JSON.stringify(priceAccountData)}`);
    });
  }

  // feedIds.forEach(testFeedIdPush);
  feedIds.forEach(testFeedIdPush);

  describe("Config updates", () => {
    it("Owner can update the config", async () => {
      const newSigners = PRIMARY_SIGNERS.slice(0, 3);
      const newThreshold = 2;
      const newMaxDelay = new anchor.BN(20 * 60 * 1000); // 20 minutes
      const newMaxAhead = new anchor.BN(5 * 60 * 1000); // 5 minutes

      await program.methods
        .updateConfig(newSigners, null, newThreshold, newMaxDelay, newMaxAhead, null)
        .accountsStrict({
          owner: provider.wallet.publicKey,
          configAccount,
        })
        .rpc();

      const updatedConfig = await program.account.configAccount.fetch(
        configAccount
      );

      expect(updatedConfig.signers).to.deep.equal(newSigners);
      expect(updatedConfig.signerCountThreshold).to.equal(newThreshold);
      expect(updatedConfig.maxTimestampDelayMs.toString()).to.equal(
        newMaxDelay.toString()
      );
      expect(updatedConfig.maxTimestampAheadMs.toString()).to.equal(
        newMaxAhead.toString()
      );
    });

    it("Non-owner cannot update the config", async () => {
      const nonOwnerWallet = anchor.web3.Keypair.generate();
      await provider.connection.requestAirdrop(
        nonOwnerWallet.publicKey,
        1000000000
      );

      try {
        await program.methods
          .updateConfig(null, null, 4, null, null, null)
          .accountsStrict({
            owner: nonOwnerWallet.publicKey,
            configAccount,
          })
          .signers([nonOwnerWallet])
          .rpc();
        expect.fail("Expected error but transaction succeeded");
      } catch (error) {
        expect((error as ProgramError).toString()).to.include(
          "A has one constraint was violated"
        );
      }
    });

    it("Partial update of config is possible", async () => {
      const originalConfig = await program.account.configAccount.fetch(
        configAccount
      );
      const newMaxDelay = new anchor.BN(25 * 60 * 1000); // 25 minutes

      await program.methods
        .updateConfig(null, null, null, newMaxDelay, null, null)
        .accountsStrict({
          owner: provider.wallet.publicKey,
          configAccount,
        })
        .rpc();

      const updatedConfig = await program.account.configAccount.fetch(
        configAccount
      );

      expect(updatedConfig.signers).to.deep.equal(originalConfig.signers);
      expect(updatedConfig.signerCountThreshold).to.equal(
        originalConfig.signerCountThreshold
      );
      expect(updatedConfig.maxTimestampDelayMs.toNumber()).to.equal(
        newMaxDelay.toNumber()
      );
      expect(updatedConfig.maxTimestampAheadMs.toNumber()).to.equal(
        originalConfig.maxTimestampAheadMs.toNumber()
      );
    });
  });
});
