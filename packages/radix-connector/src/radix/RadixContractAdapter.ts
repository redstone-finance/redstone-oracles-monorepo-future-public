import { RadixClient } from "./RadixClient";

export abstract class RadixContractAdapter {
  constructor(
    protected client: RadixClient,
    protected componentId: string
  ) {}
}
