import { Web3FunctionResult } from "@gelatonetwork/web3-functions-sdk";
import { Tx } from "@redstone-finance/utils";
import { GelatoLogger } from "./GelatoLogger";

export class GelatoDeliveryMan implements Tx.ITxDeliveryMan {
  constructor(
    private resolve: (result: Web3FunctionResult) => void,
    private logger: GelatoLogger
  ) {}

  private static makeWeb3FunctionResult(txDeliveryCall: Tx.TxDeliveryCall) {
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

  private static canExec(
    txDeliveryCall: Tx.TxDeliveryCall
  ): Web3FunctionResult {
    return {
      canExec: true,
      callData: [{ data: txDeliveryCall.data, to: txDeliveryCall.to }],
    };
  }

  deliver(txDeliveryCall: Tx.TxDeliveryCall) {
    this.logger.emitMessages();

    this.resolve(GelatoDeliveryMan.makeWeb3FunctionResult(txDeliveryCall));

    return Promise.resolve();
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
