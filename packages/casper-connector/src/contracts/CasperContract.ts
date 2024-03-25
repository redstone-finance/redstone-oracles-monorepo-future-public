import { Contracts } from "casper-js-sdk";
import { ICasperConnection } from "../casper/ICasperConnection";

export class CasperContract extends Contracts.Contract {
  constructor(
    protected connection: ICasperConnection,
    public override contractHash: string | undefined = undefined
  ) {
    super();

    if (!contractHash) {
      return;
    }

    const hash = contractHash.startsWith("0x")
      ? contractHash.substring(2)
      : contractHash;

    this.setContractHash(`hash-${hash}`);
  }
}
