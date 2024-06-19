import { RedstoneCommon } from "@redstone-finance/utils";
import { BigNumber, providers } from "ethers";
import { TxDeliveryOptsValidated } from "./TxDelivery";

export type GasEstimateTx = {
  from: string;
  to: string;
  data: string;
  value?: string;
};

export class GasLimitEstimator {
  constructor(readonly opts: TxDeliveryOptsValidated) {
    RedstoneCommon.assert(
      !(opts.gasLimit && opts.twoDimensionalFees),
      `gasLimit and twoDimensionalFees are exclusive configurations. Don't set gasLimit when u are using twoDimensionalFees it will be fetched`
    );
  }

  async getGasLimit(
    provider: providers.JsonRpcProvider,
    tx: GasEstimateTx
  ): Promise<number> {
    if (this.opts.gasLimit) {
      return this.opts.gasLimit;
    }

    const estimatedGas = (await provider.send("eth_estimateGas", [
      tx,
      // this is important to use pending not default latest block, cause we want to simulate in future block
      "pending",
    ])) as BigNumber;

    return Math.round(
      Number(estimatedGas.toString()) * this.opts.gasLimitMultiplier
    );
  }

  scaleGasLimit(gasLimit: number, attempt: number) {
    if (!this.opts.twoDimensionalFees) {
      return gasLimit;
    }
    return Math.round(gasLimit * this.opts.gasLimitMultiplier ** attempt);
  }
}
