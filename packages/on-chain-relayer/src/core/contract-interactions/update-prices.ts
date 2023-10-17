import { TransactionResponse } from "@ethersproject/providers";
import { config } from "../../config";
import { prepareLinkedListLocationsForMentoAdapterReport } from "../../custom-integrations/mento/mento-utils";

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
  const mentoAdapter = adapterContract as MentoAdapterBase;
  const sortedOraclesAddress = await mentoAdapter.getSortedOracles();
  const sortedOracles = getSortedOraclesContractAtAddress(sortedOraclesAddress);
  const maxDeviationAllowed = config().mentoMaxDeviationAllowed;
  const linkedListPositions =
    await prepareLinkedListLocationsForMentoAdapterReport(
      {
        mentoAdapter,
        wrapContract: wrapContract as (c: MentoAdapterBase) => MentoAdapterBase,
        sortedOracles,
      },
      maxDeviationAllowed
    );
  if (!linkedListPositions) {
    throw new Error(
      `Prices in Sorted Oracles deviated more than ${maxDeviationAllowed}% from Redstone prices`
    );
  }
  return await (
    wrapContract(mentoAdapter) as MentoAdapterBase
  ).updatePriceValuesAndCleanOldReports(proposedTimestamp, linkedListPositions);
};
