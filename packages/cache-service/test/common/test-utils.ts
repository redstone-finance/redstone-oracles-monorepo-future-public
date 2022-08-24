import { UniversalSigner } from "redstone-protocol";
import { MOCK_PRIVATE_KEY } from "./mock-values";

export const signByMockSigner = (signableData: any): string => {
  return UniversalSigner.signStringifiableData(signableData, MOCK_PRIVATE_KEY);
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
