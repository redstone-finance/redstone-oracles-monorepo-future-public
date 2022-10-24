import { Signer } from "ethers";
import { network, waffle } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
const { provider } = waffle;

// Note!: It's quite important to have the deterministic version of ECDSA
// Signatures here. Looks like ethereum uses the deterministic version of
// ECDSA: https://ethereum.stackexchange.com/a/66240
// But it will be a good practice to also back up a generated salt in
// local storage and maybe even display it to a user
export const generateSaltForVote = async (
  disputeId: number,
  signer: Signer
): Promise<string> => {
  const seedMessage = toUtf8Bytes(disputeId + "REDSTONE_DISPUTE_SALT");
  const signature = await signer.signMessage(seedMessage);
  const salt = keccak256(signature);
  return salt;
};

export type Second = number;

export const time = {
  increase: async (duration: Second) => {
    await network.provider.send("evm_increaseTime", [duration]);
    await network.provider.send("evm_mine");
  },
  setTime: async (timestamp: number) => {
    //const now = Math.ceil(new Date().getTime() / 1000);
    await provider.send("evm_setNextBlockTimestamp", [timestamp]);
  },
  setTimeAndMine: async (timestamp: number) => {
    //const now = Math.ceil(new Date().getTime() / 1000);
    await provider.send("evm_setNextBlockTimestamp", [timestamp]);
    await network.provider.send("evm_mine");
  },
  duration: {
    years: (years: number): Second => {
      return 60 * 60 * 24 * 365 * years; //TODO: leap years..
    },
    months: (months: number): Second => {
      return 60 * 60 * 24 * 30 * months; // ofc. it is simplified..
    },
    days: (days: number): Second => {
      return 60 * 60 * 24 * days;
    },
    hours: (hours: number): Second => {
      return 60 * 60 * hours;
    },
    minutes: (minutes: number): Second => {
      return 60 * minutes;
    },
  },
};
