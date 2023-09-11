import axios from "axios";
import {
  Abi,
  AccountInterface,
  Contract,
  Provider,
  TransactionFinalityStatus,
} from "starknet";

export enum NetworkName {
  SN_MAIN = "SN_MAIN",
  SN_GOERLI = "SN_GOERLI",
  SN_GOERLI2 = "SN_GOERLI2",
}
export const FEE_MULTIPLIER = 1000000000000000000;

export abstract class StarknetContractConnector {
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

  async waitForTransaction(txHash: string): Promise<boolean> {
    const successState = TransactionFinalityStatus.ACCEPTED_ON_L2;
    const result = await this.provider.waitForTransaction(txHash, {
      successStates: [successState],
    });

    var logText = `Transaction ${txHash} finished with status: ${result.status}`;
    const anyResult = result as any;

    if (!!anyResult.actual_fee) {
      logText += `, fee: ${
        parseInt(anyResult.actual_fee) / FEE_MULTIPLIER
      } ETH`;
    }

    console.log(logText);

    return result.status == successState;
  }

  getContract(): Contract {
    return new Contract(this.abi, this.contractAddress, this.provider);
  }

  async getBlockNumber(rpcUrl: string): Promise<number> {
    const response = await axios.post(rpcUrl, {
      jsonrpc: "2.0",
      method: "starknet_blockNumber",
      params: [],
      id: 1,
    });

    return response.data.result;
  }
}
