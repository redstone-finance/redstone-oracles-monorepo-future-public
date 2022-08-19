import {
  joinSignature,
  keccak256,
  SigningKey,
  toUtf8Bytes,
} from "ethers/lib/utils";
import { mockOracleRegistryState, MOCK_PRIVATE_KEY } from "./mock-values";

export const signByMockSigner = (message: string): string => {
  const digest = keccak256(toUtf8Bytes(message));
  const signingKey = new SigningKey(MOCK_PRIVATE_KEY);
  const fullSignature = signingKey.signDigest(digest);
  return joinSignature(fullSignature);
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
