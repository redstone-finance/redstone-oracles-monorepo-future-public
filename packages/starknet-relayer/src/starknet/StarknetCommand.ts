import { Contract, Result, Account, Abi } from "starknet";

export const FEE_MULTIPLIER = 1000000000000000000;

export abstract class StarknetCommand {
  constructor(
    private abi: Abi,
    private contractAddress: string,
    protected account: Account
  ) {}

  abstract getMethodName(): string;
  abstract getArgs(): Promise<any>;
  abstract getValue(response: Result): any;

  async execute() {
    const contract = this.getContract();
    const args = await this.getArgs();
    const response = await contract.call(this.getMethodName(), args);

    return this.getValue(response);
  }

  getContract() {
    return new Contract(this.abi, this.contractAddress, this.account);
  }
}

export abstract class InvokeStarknetCommand extends StarknetCommand {
  protected constructor(
    abi: Abi,
    contractAddress: string,
    account: Account,
    private maxEthFee: number = 0.004
  ) {
    super(abi, contractAddress, account);
  }

  async execute() {
    const contract = this.getContract();

    const args = await this.getArgs();
    const response = await contract.invoke(this.getMethodName(), args, {
      maxFee: this.maxEthFee * FEE_MULTIPLIER,
    });

    return response.transaction_hash;
  }

  getValue(response: Result) {
    return undefined;
  }
}
