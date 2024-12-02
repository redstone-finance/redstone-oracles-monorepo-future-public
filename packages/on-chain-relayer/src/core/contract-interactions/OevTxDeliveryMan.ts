import { TransactionResponse } from "@ethersproject/providers";
import { ContractParamsProvider } from "@redstone-finance/sdk";
import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";
import { RelayerConfig } from "../../config/RelayerConfig";
import { updateUsingOevAuction } from "../../custom-integrations/fastlane/update-using-oev-auction";
import { RedstoneEvmContract } from "../../facade/EvmContractFacade";
import {
  ITxDeliveryMan,
  SelfHandled,
  TxDeliveryCall,
} from "./tx-delivery-gelato-bypass";

export class OevTxDeliveryMan implements ITxDeliveryMan {
  private logger = loggerFactory("updatePrices/oev");

  constructor(
    private readonly baseDeliveryMan: ITxDeliveryMan,
    private readonly adapterContract: RedstoneEvmContract,
    private readonly relayerConfig: RelayerConfig
  ) {}

  async deliver(
    txDeliveryCall: TxDeliveryCall,
    deferredCallData?: () => Promise<string>,
    paramsProvider?: ContractParamsProvider
  ): Promise<TransactionResponse | typeof SelfHandled> {
    try {
      await this.updateUsingOevAction(txDeliveryCall, paramsProvider);

      return SelfHandled;
    } catch (error) {
      this.logger.error(
        `Failed to update using OEV auction, proceeding with standard update, error: ${RedstoneCommon.stringifyError(error)}`
      );

      return await this.baseDeliveryMan.deliver(
        txDeliveryCall,
        deferredCallData,
        paramsProvider
      );
    }
  }

  private async updateUsingOevAction(
    txDeliveryCall: TxDeliveryCall,
    paramsProvider: ContractParamsProvider | undefined
  ) {
    const updateUsingOevAuctionPromise = updateUsingOevAuction(
      this.relayerConfig,
      txDeliveryCall.data,
      await this.adapterContract.provider.getBlockNumber(),
      this.adapterContract,
      await paramsProvider!.requestDataPackages()
    );
    const timeout = this.relayerConfig.oevTotalTimeout;

    await RedstoneCommon.timeout(
      updateUsingOevAuctionPromise,
      timeout,
      `Updating using OEV auction didn't succeed in ${timeout} [ms].`
    );
  }
}
