import {
  TransactionReceipt,
  TransactionResponse,
} from "@ethersproject/providers";
import {
  MentoAdapterBase,
  RedstoneAdapterBase,
} from "../../../typechain-types";
import { UpdatePricesArgs } from "../../args/get-iteration-args";
import { config } from "../../config";
import { prepareLinkedListLocationsForMentoAdapterReport } from "../../custom-integrations/mento/mento-utils";
import { getSortedOraclesContractAtAddress } from "./get-contract";
import { getTxDeliveryMan } from "../TxDeliveryManSingleton";
import { isEthersError } from "@redstone-finance/rpc-providers";
import { RedstoneCommon } from "@redstone-finance/utils";

export const updatePrices = async (updatePricesArgs: UpdatePricesArgs) => {
  const updateTx = await updatePriceInAdapterContract(updatePricesArgs);

  // is not using await to not block the main function
  updateTx
    .wait()
    .then((receipt) => console.log(getTxReceiptDesc(receipt)))
    .catch((error) => describeTxWaitError(error, updateTx.hash));

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

  return await getTxDeliveryMan().deliver(
    wrappedContract,
    "updateDataFeedsValues",
    [proposedTimestamp]
  );
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

  return await getTxDeliveryMan().deliver(
    wrappedMentoContract,
    "updatePriceValuesAndCleanOldReports",
    [proposedTimestamp, linkedListPositions]
  );
};

const getTxReceiptDesc = (receipt: TransactionReceipt) => {
  const ONE_GIGA = 10 ** 9;
  const gasPrice = receipt.effectiveGasPrice.toNumber() / ONE_GIGA;

  return `Transaction ${receipt.transactionHash} SUCCESS(status: ${
    receipt.status
  }) in block #${receipt.blockNumber}[tx index: ${
    receipt.transactionIndex
  }]. Gas used: ${receipt.gasUsed.toString()} with price ${gasPrice} = ${
    (receipt.gasUsed.toNumber() * gasPrice) / ONE_GIGA
  } of total fee`;
};

function describeTxWaitError(error: unknown, hash: string) {
  if (isEthersError(error)) {
    console.error(`Transaction ${hash} FAILED with error: ${error.code}`);
  } else {
    console.error(
      `Transaction ${hash} receipt fetching error: ${RedstoneCommon.stringifyError(
        error
      )}`
    );
  }
}
