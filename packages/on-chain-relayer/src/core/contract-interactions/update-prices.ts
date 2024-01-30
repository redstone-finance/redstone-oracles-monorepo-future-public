import { TransactionResponse } from "@ethersproject/providers";
import {
  MentoAdapterBase,
  RedstoneAdapterBase,
} from "../../../typechain-types";
import { UpdatePricesArgs } from "../../args/get-iteration-args";
import { config } from "../../config";
import { prepareLinkedListLocationsForMentoAdapterReport } from "../../custom-integrations/mento/mento-utils";
import { getSortedOraclesContractAtAddress } from "./get-contract";
import { getTxDeliveryMan } from "../TxDeliveryManSingleton";

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
      return await updatePricesInPriceFeedsAdapter(
        args as UpdatePricesArgs<RedstoneAdapterBase>
      );
    case "mento":
      return await updatePricesInMentoAdapter(
        args as UpdatePricesArgs<MentoAdapterBase>
      );
    default:
      throw new Error(
        `Unsupported adapter contract type: ${config().adapterContractType}`
      );
  }
};

const updatePricesInPriceFeedsAdapter = async ({
  proposedTimestamp,
  dataPackagesWrapper,
  adapterContract,
}: UpdatePricesArgs<RedstoneAdapterBase>): Promise<TransactionResponse> => {
  dataPackagesWrapper.setMetadataTimestamp(Date.now());
  const wrappedContract =
    dataPackagesWrapper.overwriteEthersContract(adapterContract);

  const deliveryResult = await getTxDeliveryMan().deliver(
    wrappedContract,
    "updateDataFeedsValues",
    [proposedTimestamp]
  );

  return deliveryResult;
};

const updatePricesInMentoAdapter = async ({
  proposedTimestamp,
  dataPackagesWrapper,
  adapterContract: mentoAdapter,
}: UpdatePricesArgs<MentoAdapterBase>): Promise<TransactionResponse> => {
  const sortedOraclesAddress = await mentoAdapter.getSortedOracles();
  const sortedOracles = getSortedOraclesContractAtAddress(sortedOraclesAddress);
  const maxDeviationAllowed = config().mentoMaxDeviationAllowed;
  const linkedListPositions =
    await prepareLinkedListLocationsForMentoAdapterReport(
      {
        mentoAdapter,
        dataPackagesWrapper,
        sortedOracles,
      },
      maxDeviationAllowed
    );
  if (!linkedListPositions) {
    throw new Error(
      `Prices in Sorted Oracles deviated more than ${maxDeviationAllowed}% from RedStone prices`
    );
  }

  dataPackagesWrapper.setMetadataTimestamp(Date.now());
  const wrappedMentoContract =
    dataPackagesWrapper.overwriteEthersContract(mentoAdapter);

  const deliveryResult = await getTxDeliveryMan().deliver(
    wrappedMentoContract,
    "updatePriceValuesAndCleanOldReports",
    [proposedTimestamp, linkedListPositions]
  );
  return deliveryResult;
};
