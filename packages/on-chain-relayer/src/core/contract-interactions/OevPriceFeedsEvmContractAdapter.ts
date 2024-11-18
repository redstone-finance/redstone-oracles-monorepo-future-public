import { ContractParamsProvider } from "@redstone-finance/sdk";
import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";
import { RedstoneAdapterBase } from "../../../typechain-types";
import { config } from "../../config";
import { updateUsingOevAuction } from "../../custom-integrations/fastlane/update-using-oev-auction";
import { PriceFeedsEvmContractAdapter } from "./PriceFeedsEvmContractAdapter";

const logger = loggerFactory("updatePrices/oev");

export class OevPriceFeedsEvmContractAdapter<
  Contract extends RedstoneAdapterBase,
> extends PriceFeedsEvmContractAdapter<Contract> {
  override async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<void> {
    try {
      const updateUsingOevAuctionPromise = updateUsingOevAuction(
        (await this.makeUpdateTx(paramsProvider)).data,
        await this.adapterContract.provider.getBlockNumber(), // TODO: additional call here
        this.adapterContract,
        await paramsProvider.requestDataPackages()
      );
      const timeout = config().oevTotalTimeout;
      await RedstoneCommon.timeout(
        updateUsingOevAuctionPromise,
        timeout,
        `Updating using OEV auction didn't succeed in ${timeout} [ms].`
      );

      return;
    } catch (error) {
      logger.error(
        `Failed to update using OEV auction, proceeding with standard update, error: ${RedstoneCommon.stringifyError(error)}`
      );

      await super.writePricesFromPayloadToContract(paramsProvider);
    }
  }
}
