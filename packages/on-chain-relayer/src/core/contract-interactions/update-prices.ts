import { TransactionResponse } from "@ethersproject/providers";
import { config } from "../../config";
import {
  MentoContracts,
  prepareLinkedListLocationsForMentoAdapterReport,
} from "../../custom-integrations/mento/mento-utils";

import { getSortedOraclesContractAtAddress } from "./get-contract";
import { TransactionDeliveryMan } from "@redstone-finance/rpc-providers";
import { UpdatePricesArgs } from "../../args/get-update-prices-args";
import { MentoAdapterBase } from "../../../typechain-types";

let deliveryMan: TransactionDeliveryMan | undefined = undefined;
const getDeliveryMan = () => {
  deliveryMan =
    deliveryMan ??
    new TransactionDeliveryMan({
      expectedDeliveryTimeMs: config().expectedTxDeliveryTimeInMS,
      gasLimit: config().gasLimit,
      twoDimensionFees: config().isArbitrumNetwork,
      multiplier: config().gasMultiplier,
      isAuctionModel: config().isAuctionModel,
    });
  return deliveryMan;
};

export const updatePrices = async (updatePricesArgs: UpdatePricesArgs) => {
  const updateTx = await updatePriceInAdapterContract(updatePricesArgs);

  console.log(
    `Update prices tx delivered hash=${updateTx.hash} gasLimit=${String(
      updateTx.gasLimit
    )} gasPrice=${updateTx.gasPrice?.toString()} maxFeePerGas=${String(
      updateTx.maxFeePerGas
    )} maxPriorityFeePerGas=${String(updateTx.maxPriorityFeePerGas)}`
  );
};

const updatePriceInAdapterContract = async (
  args: UpdatePricesArgs
): Promise<TransactionResponse> => {
  switch (config().adapterContractType) {
    case "price-feeds":
      return await updatePricesInPriceFeedsAdapter(args);
    case "mento":
      return await updatePricesInMentoAdapter(args);
    default:
      throw new Error(
        `Unsupported adapter contract type: ${config().adapterContractType}`
      );
  }
};

const updatePricesInPriceFeedsAdapter = async ({
  adapterContract,
  wrapContract,
  proposedTimestamp,
}: UpdatePricesArgs): Promise<TransactionResponse> => {
  const wrappedContract = wrapContract(adapterContract);

  const deliveryResult = await getDeliveryMan().deliver(
    wrappedContract,
    "updateDataFeedsValues",
    [proposedTimestamp]
  );

  return deliveryResult;
};

const updatePricesInMentoAdapter = async ({
  adapterContract,
  wrapContract,
  proposedTimestamp,
}: UpdatePricesArgs): Promise<TransactionResponse> => {
  // eslint-disable-next-line
  const sortedOraclesAddress: string = await adapterContract.getSortedOracles();
  const sortedOracles = getSortedOraclesContractAtAddress(sortedOraclesAddress);
  const linkedListPositions =
    await prepareLinkedListLocationsForMentoAdapterReport({
      mentoAdapter: adapterContract,
      wrapContract,
      sortedOracles,
    } as MentoContracts);
  return await (
    wrapContract(adapterContract) as MentoAdapterBase
  ).updatePriceValuesAndCleanOldReports(proposedTimestamp, linkedListPositions);
};
