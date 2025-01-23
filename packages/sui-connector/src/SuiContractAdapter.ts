import { SuiClient } from "@mysten/sui/client";
import type { Keypair } from "@mysten/sui/cryptography";
import { Transaction } from "@mysten/sui/transactions";
import { loggerFactory } from "@redstone-finance/utils";

export const DEFAULT_GAS_BUDGET = 10000000n;

export class SuiContractAdapter {
  protected readonly logger = loggerFactory("sui-contract-adapter");

  constructor(
    protected readonly client: SuiClient,
    protected readonly keypair?: Keypair
  ) {}

  protected async computeGasBudget(units: bigint) {
    const date = Date.now();
    const gasPrice = await this.client.getReferenceGasPrice();
    this.logger.info(
      `Reference gas price: ${gasPrice} MIST fetched in ${Date.now() - date} [ms]`
    );

    return gasPrice * units;
  }

  protected prepareTransaction(gasBudget?: bigint) {
    if (!this.keypair) {
      throw new Error("A keypair is needed to write prices to contract");
    }

    const tx = new Transaction();
    tx.setGasBudgetIfNotSet(gasBudget ?? DEFAULT_GAS_BUDGET);
    tx.setSenderIfNotSet(this.keypair.toSuiAddress());

    return tx;
  }

  protected async sendTransaction(tx: Transaction) {
    if (!this.keypair) {
      throw new Error("A keypair is needed to send transaction");
    }

    const date = Date.now();
    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.keypair,
    });

    this.logger.log(
      `Transaction ${result.digest} sent in ${Date.now() - date} [ms]`
    );

    return result.digest;
  }
}
