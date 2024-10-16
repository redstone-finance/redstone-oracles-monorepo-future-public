import {
  ContractParamsProvider,
  IPricesContractAdapter,
} from "@redstone-finance/sdk";
import { loggerFactory } from "@redstone-finance/utils";
import { BigNumberish } from "ethers";
import {
  BN,
  formatUnits,
  FunctionInvocationScope,
  FunctionResult,
} from "fuels";
import { Option, Vec } from "../autogenerated/common";
import { FuelPricesContract } from "./FuelPricesContractConnector";

const logger = loggerFactory("fuel-connector/prices-contract-adapter");

export class FuelPricesContractAdapter implements IPricesContractAdapter {
  constructor(
    public contract: FuelPricesContract,
    private gasLimit: number
  ) {}

  async getUniqueSignerThreshold(): Promise<number> {
    return (
      await this.contract.functions.get_unique_signer_threshold().get()
    ).value.toNumber();
  }

  async getPricesFromPayload(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    return this.extractNumbers(
      (await this.callGetPrices(paramsProvider)).value[0]
    );
  }

  async callGetPrices(paramsProvider: ContractParamsProvider) {
    return await this.contract.functions
      .get_prices(
        paramsProvider.getHexlifiedFeedIds(),
        await paramsProvider.getPayloadData()
      )
      .get();
  }

  async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    return this.extractNumbers(
      (await this.callWritePrices(paramsProvider)).value
    );
  }

  async callWritePrices(paramsProvider: ContractParamsProvider) {
    return await this.call(
      this.contract.functions.write_prices(
        paramsProvider.getHexlifiedFeedIds(),
        await paramsProvider.getPayloadData()
      ),
      this.getGasLimit(
        paramsProvider.getDataFeedIds().length,
        paramsProvider.requestParams.uniqueSignersCount
      )
    );
  }

  async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    return this.extractNumbers(
      (await this.callReadPrices(paramsProvider)).value
    );
  }

  async callReadPrices(paramsProvider: ContractParamsProvider) {
    return await this.contract.functions
      .read_prices(paramsProvider.getHexlifiedFeedIds())
      .get();
  }

  async readTimestampFromContract(): Promise<number> {
    return (await this.callReadTimestamp()).value.toNumber();
  }

  async callReadTimestamp() {
    return await this.contract.functions.read_timestamp().get();
  }

  protected async call<TArgs extends Array<unknown>, TReturn>(
    functionInvocationScope: FunctionInvocationScope<TArgs, TReturn>,
    gasLimit?: number
  ): Promise<FunctionResult<TReturn>> {
    const { waitForResult, transactionId } = await functionInvocationScope
      .txParams({
        gasLimit,
      })
      .call();

    logger.log(`TxId: ${transactionId} submitted`);
    const result = await waitForResult();
    logger.log(
      `TxId: ${transactionId} status: ${result.transactionResult.status}`
    );
    logger.log(
      `TxId: ${transactionId} gasUsed: ${result.gasUsed.toString()}, fee: ${formatUnits(result.transactionResult.fee)} ETH, tip: ${formatUnits(result.transactionResult.tip)} ETH`
    );

    return result;
  }

  protected extractNumbers(result: Vec<Option<BN>>): BigNumberish[] {
    return result.map((num) => (num ? BigInt(num.toHex()) : 0n));
  }

  protected getGasLimit(_dataFeedIdCount: number, _uniqueSignersCount: number) {
    return this.gasLimit;
  }
}
