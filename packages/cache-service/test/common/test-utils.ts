import { UniversalSigner } from "@redstone-finance/protocol";
import { MOCK_PRIVATE_KEY } from "./mock-values";

export const signByMockSigner = (
  signableData: unknown,
  privateKey: string = MOCK_PRIVATE_KEY
): string => {
  return UniversalSigner.signStringifiableData(signableData, privateKey);
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
