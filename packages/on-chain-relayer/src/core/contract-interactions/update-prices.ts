import {
  TransactionReceipt,
  TransactionResponse,
} from "@ethersproject/providers";
import {
  isEthersError,
  makeTxDeliveryCall,
} from "@redstone-finance/rpc-providers";
import { RedstoneCommon } from "@redstone-finance/utils";
import { providers } from "ethers";
import {
  MentoAdapterBase,
  RedstoneAdapterBase,
} from "../../../typechain-types";
import { UpdatePricesArgs } from "../../args/get-iteration-args";
import { config } from "../../config";
import { prepareLinkedListLocationsForMentoAdapterReport } from "../../custom-integrations/mento/mento-utils";
import { getTxDeliveryMan } from "../TxDeliveryManSingleton";

import { getSortedOraclesContractAtAddress } from "./get-sorted-oracles-contract-at-address";

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

  const txCall = makeTxDeliveryCall(
    await wrappedContract.populateTransaction["updateDataFeedsValues"](
      proposedTimestamp
    )
  );

  const txDeliveryMan = getTxDeliveryMan(
    wrappedContract.signer,
    wrappedContract.provider as providers.JsonRpcProvider
  );

  return await txDeliveryMan.deliver(txCall);
};

const updatePricesInMentoAdapter = async ({
  proposedTimestamp,
  dataPackagesWrapper,
  adapterContract: mentoAdapter,
  blockTag,
}: UpdatePricesArgs<MentoAdapterBase>): Promise<TransactionResponse> => {
  const sortedOraclesAddress = await mentoAdapter.getSortedOracles({
    blockTag,
  });
  const sortedOracles = getSortedOraclesContractAtAddress(
    sortedOraclesAddress,
    mentoAdapter.provider
  );
  const maxDeviationAllowed = config().mentoMaxDeviationAllowed;

  const linkedListPositions =
    await prepareLinkedListLocationsForMentoAdapterReport(
      {
        mentoAdapter,
        dataPackagesWrapper,
        sortedOracles,
      },
      blockTag,
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

  const txCall = makeTxDeliveryCall(
    await wrappedMentoContract.populateTransaction[
      "updatePriceValuesAndCleanOldReports"
    ](proposedTimestamp, linkedListPositions)
  );

  const txDeliveryMan = getTxDeliveryMan(
    wrappedMentoContract.signer,
    wrappedMentoContract.provider as providers.JsonRpcProvider
  );

  return await txDeliveryMan.deliver(txCall);
};

const getTxReceiptDesc = (receipt: TransactionReceipt) => {
  return `Transaction ${receipt.transactionHash} SUCCESS(status: ${
    receipt.status
  }) in block #${receipt.blockNumber}[tx index: ${
    receipt.transactionIndex
  }]. gas_used=${receipt.gasUsed.toString()} effective_gas_price=${receipt.effectiveGasPrice.toString()}`;
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
