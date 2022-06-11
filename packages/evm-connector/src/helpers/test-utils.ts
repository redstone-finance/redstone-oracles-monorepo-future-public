import { ethers } from "ethers";

export type MockSignerAddress =
  | "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  | "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  | "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

// Well-known private keys, which are used by
// default in hardhat testing environment
export const MOCK_PRIVATE_KEYS = [
  // Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",

  // Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",

  // Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
];

export function getMockSignerPrivateKey(mockSignerAddress: MockSignerAddress) {
  for (const privateKey of MOCK_PRIVATE_KEYS) {
    const address = new ethers.Wallet(privateKey).address;
    if (address === mockSignerAddress) {
      return privateKey;
    }
  }
  throw new Error(`Invalid mock signer address: ${mockSignerAddress}`);
}
