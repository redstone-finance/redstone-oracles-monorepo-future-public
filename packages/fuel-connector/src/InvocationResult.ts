import { BN } from "fuels";

export interface InvocationResult<TReturn> {
  readonly value: TReturn;
  readonly gasUsed: BN;
}
