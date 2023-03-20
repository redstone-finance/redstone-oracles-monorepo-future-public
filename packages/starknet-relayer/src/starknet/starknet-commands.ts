import { Result, Account, Abi } from "starknet";
import { ContractDataProvider } from "redstone-sdk";
import { InvokeStarknetCommand, StarknetCommand } from "./StarknetCommand";

export class WritePricesCommand extends InvokeStarknetCommand {
  constructor(
    abi: Abi,
    contractAddress: string,
    account: Account,
    maxEthFee: number = 0.004,
    private dataProvider: ContractDataProvider,
    private round: number
  ) {
    super(abi, contractAddress, account, maxEthFee);
  }

  getMethodName(): string {
    return "write_prices";
  }

  async getArgs(): Promise<any> {
    return [
      this.round,
      await this.dataProvider.getDataFeedNumbers(),
      await this.dataProvider.getPayloadData(),
    ];
  }
}

export class ReadRoundDataCommand extends StarknetCommand {
  getMethodName(): string {
    return "read_round_data";
  }

  async getArgs(): Promise<any> {
    return [];
  }

  getValue(response: Result) {
    return {
      payload_timestamp: response.payload_timestamp.toNumber() * 1000,
      round: response.round.toNumber(),
      block_number: response.block_number.toNumber(),
      block_timestamp: response.block_timestamp.toNumber(),
    };
  }
}

export class LatestRoundDataCommand extends StarknetCommand {
  getMethodName(): string {
    return "latest_round_data";
  }

  async getArgs(): Promise<any> {
    return [];
  }

  getValue(response: Result) {
    return response[0];
  }
}
