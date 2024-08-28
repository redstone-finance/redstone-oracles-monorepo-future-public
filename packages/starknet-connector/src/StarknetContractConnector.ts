import { IContractConnector } from "@redstone-finance/sdk";
import {
  Abi,
  BlockTag,
  Contract,
  ProviderInterface,
  TransactionFinalityStatus,
} from "starknet";

export const FEE_MULTIPLIER = 1000000000000000000;

export abstract class StarknetContractConnector<Adapter>
  implements IContractConnector<Adapter>
{
  protected constructor(
    protected provider: ProviderInterface,
    private contractAddress: string,
    private abi: Abi
  ) {}

  abstract getAdapter(): Promise<Adapter>;

  async waitForTransaction(txHash: string): Promise<boolean> {
    const successState = TransactionFinalityStatus.ACCEPTED_ON_L2;
    const result = await this.provider.waitForTransaction(txHash, {
      successStates: [successState],
    });

    const acceptedResult = result as unknown as {
      execution_status: string;
      actual_fee: { amount: string; unit: "WEI" };
      revert_reason?: string;
    };

    let logText = `Transaction ${txHash} finished with status: ${acceptedResult.execution_status}`;
    if (acceptedResult.revert_reason) {
      logText += acceptedResult.revert_reason;
    }

    logText += `, fee: ${
      parseInt(acceptedResult.actual_fee.amount) / FEE_MULTIPLIER
    } ETH`;

    console.log(logText);

    return acceptedResult.execution_status === successState.toString();
  }

  getContract(): Contract {
    return new Contract(this.abi, this.contractAddress, this.provider);
  }

  async getBlockNumber(): Promise<number> {
    return (await this.provider.getBlock(BlockTag.latest)).block_number;
  }
}
