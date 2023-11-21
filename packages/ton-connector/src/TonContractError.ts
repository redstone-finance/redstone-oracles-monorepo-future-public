import { TonContract } from "./TonContract";

export class TonContractError extends Error {
  constructor(
    message: string,
    public contract: TonContract
  ) {
    super(message);
  }
}
