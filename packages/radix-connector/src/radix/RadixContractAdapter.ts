import { RadixClient } from "./RadixClient";

export type ReadMode = "ReadFromStorage" | "CallReadMethod";

export abstract class RadixContractAdapter {
  constructor(
    protected client: RadixClient,
    protected componentId: string,
    public readMode: ReadMode = "ReadFromStorage"
  ) {}
}
