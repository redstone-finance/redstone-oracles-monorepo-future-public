import axios from "axios";
import {
  Abi,
  AccountInterface,
  Contract,
  Provider,
  TransactionFinalityStatus,
} from "starknet";
import { IContractConnector } from "@redstone-finance/sdk";

export enum NetworkName {
  SN_MAIN = "SN_MAIN",
  SN_GOERLI = "SN_GOERLI",
  SN_GOERLI2 = "SN_GOERLI2",
}
export const FEE_MULTIPLIER = 1000000000000000000;

export abstract class StarknetContractConnector<Adapter>
  implements IContractConnector<Adapter>
{
  provider: AccountInterface | Provider;

  protected constructor(
    account: AccountInterface | undefined,
    private contractAddress: string,
    private abi: Abi,
    private network: NetworkName = NetworkName.SN_GOERLI
  ) {
    this.provider =
      account || new Provider({ sequencer: { network: this.network } });
  }

  abstract getAdapter(): Promise<Adapter>;

  async waitForTransaction(txHash: string): Promise<boolean> {
    const successState = TransactionFinalityStatus.ACCEPTED_ON_L2;
    const result = await this.provider.waitForTransaction(txHash, {
      successStates: [successState],
    });

    let logText = `Transaction ${txHash} finished with status: ${result.status}`;
    const anyResult = result as { actual_fee?: string };

    if (anyResult.actual_fee) {
      logText += `, fee: ${
        parseInt(anyResult.actual_fee) / FEE_MULTIPLIER
      } ETH`;
    }

    console.log(logText);

    return result.status?.toString() === successState.toString();
  }

  getContract(): Contract {
    return new Contract(this.abi, this.contractAddress, this.provider);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Interface requirement
  async getBlockNumber(rpcUrl: string): Promise<number> {
    const response = await axios.post(rpcUrl, {
      jsonrpc: "2.0",
      method: "starknet_blockNumber",
      params: [],
      id: 1,
    });

    // eslint-disable-next-line
    return response.data.result;
  }
}
