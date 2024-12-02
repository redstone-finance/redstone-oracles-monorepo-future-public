import { Web3FunctionResult } from "@gelatonetwork/web3-functions-sdk";
import {
  ITxDeliveryMan,
  SelfHandled,
} from "@redstone-finance/on-chain-relayer";
import { TxDeliveryCall } from "@redstone-finance/rpc-providers";
import { GelatoLogger } from "./GelatoLogger";

export class GelatoDeliveryMan implements ITxDeliveryMan {
  constructor(
    private resolve: (result: Web3FunctionResult) => void,
    private logger: GelatoLogger
  ) {}

  private static makeWeb3FunctionResult(txDeliveryCall: TxDeliveryCall) {
    if (!!txDeliveryCall.data && txDeliveryCall.data != "0x") {
      return GelatoDeliveryMan.canExec(txDeliveryCall);
    } else {
      return GelatoDeliveryMan.shouldNotExec(
        `Wrong transaction data: '${txDeliveryCall.data}'`
      );
    }
  }

  private static shouldNotExec(message: string): Web3FunctionResult {
    return { canExec: false, message };
  }

  private static canExec(txDeliveryCall: {
    data: string;
    to: string;
  }): Web3FunctionResult {
    return {
      canExec: true,
      callData: [{ data: txDeliveryCall.data, to: txDeliveryCall.to }],
    };
  }

  deliver(txDeliveryCall: TxDeliveryCall) {
    this.logger.emitMessages();

    this.resolve(GelatoDeliveryMan.makeWeb3FunctionResult(txDeliveryCall));

    return Promise.resolve(SelfHandled);
  }

  doNotDeliver() {
    this.logger.emitMessages();

    this.resolve(
      GelatoDeliveryMan.shouldNotExec(
        this.logger.getMainMessage() ?? "Unknown reason"
      )
    );
  }
}
