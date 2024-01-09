import { Wallet } from "@fuel-ts/wallet";
import { NativeAssetId, Provider } from "fuels";
import { seedTestWallet } from "../common/test-utils";

jest.setTimeout(10 * 60000);

const IS_LOCAL = true as boolean;

// For the beta-2 node the 'fuels' version must not be greater than 0.32.0
const provider = IS_LOCAL
  ? undefined
  : new Provider("https://beta-3.fuel.network/graphql");

const wallet = Wallet.fromPrivateKey(process.env.PRIVATE_KEY!, provider);

describe("Faucet from GENESIS wallet", () => {
  it("Transfer 0.001 ETHs", async () => {
    await seedTestWallet(wallet, [[1_000_000, NativeAssetId]]);
  });
});
