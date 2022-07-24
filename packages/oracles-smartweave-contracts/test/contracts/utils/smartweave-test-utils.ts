import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";

export const mineBlock = async (arweave: Arweave): Promise<void> => {
  await arweave.api.get("mine");
};

export const addFunds = async (
  arweave: Arweave,
  wallet: JWKInterface
): Promise<void> => {
  const walletAddress = await arweave.wallets.getAddress(wallet);
  await arweave.api.get(`/mint/${walletAddress}/1000000000000000`);
};
