import { UniversalSigner } from "@redstone-finance/protocol";
import { MOCK_PRIVATE_KEY } from "./mock-values";

export const signByMockSigner = (signableData: unknown): string => {
  return UniversalSigner.signStringifiableData(signableData, MOCK_PRIVATE_KEY);
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
