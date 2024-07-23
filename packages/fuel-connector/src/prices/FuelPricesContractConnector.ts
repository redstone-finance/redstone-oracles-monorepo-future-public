import { IPricesContractAdapter } from "@redstone-finance/sdk";
import { Account, Contract } from "fuels";
import { FuelContractConnector } from "../FuelContractConnector";
import { PricesAbi, PricesAbi__factory } from "../autogenerated";
import { FuelPricesContractAdapter } from "./FuelPricesContractAdapter";

export type FuelPricesContract = PricesAbi & Contract;

export class FuelPricesContractConnector extends FuelContractConnector<IPricesContractAdapter> {
  constructor(
    wallet: Account | undefined,
    private contractId: string
  ) {
    super(wallet);
  }

  getContract(): FuelPricesContract {
    return PricesAbi__factory.connect(this.contractId, this.wallet!);
  }

  async getAdapter(): Promise<IPricesContractAdapter> {
    return await Promise.resolve(
      new FuelPricesContractAdapter(this.getContract(), this.getGasLimit())
    );
  }
}
