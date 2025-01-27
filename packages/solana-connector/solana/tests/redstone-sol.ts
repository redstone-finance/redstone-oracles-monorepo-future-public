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
  const systemProgram = anchor.web3.SystemProgram.programId;

  before(async () => {
    for (const feedId of feedIds) {
      pdas[feedId] = anchor.web3.PublicKey.findProgramAddressSync(
        [makePriceSeed(), makeFeedIdBytes(feedId)],
        program.programId
      )[0];
    }
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

  feedIds.forEach(testFeedIdPush);
});
