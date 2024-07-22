import { TransactionReceipt } from "@ethersproject/providers";
import {
  TxDeliveryCall,
  convertToTxDeliveryCall,
} from "@redstone-finance/rpc-providers";
import { RedstoneCommon, loggerFactory } from "@redstone-finance/utils";
import { providers, utils } from "ethers";
import {
  MentoAdapterBase,
  MultiFeedAdapterWithoutRounds,
  RedstoneAdapterBase,
} from "../../../typechain-types";
import { config } from "../../config";
import { prepareLinkedListLocationsForMentoAdapterReport } from "../../custom-integrations/mento/mento-utils";
import { getTxDeliveryMan } from "../TxDeliveryManSingleton";

import { DataPackagesWrapper } from "@redstone-finance/evm-connector";
import { getSortedOraclesContractAtAddress } from "../../custom-integrations/mento/get-sorted-oracles-contract-at-address";
import { UpdatePricesArgs } from "../../types";
import { chooseDataPackagesTimestamp } from "../update-conditions/data-packages-timestamp";

const logger = loggerFactory("updatePrices");

export const updatePrices = async (updatePricesArgs: UpdatePricesArgs) => {
  const updateTx = await makeUpdateTx(updatePricesArgs);

  const txDeliveryMan = getTxDeliveryMan(
    updatePricesArgs.adapterContract.signer,
    updatePricesArgs.adapterContract.provider as providers.JsonRpcProvider
  );

  const updateTxResponse = await txDeliveryMan.deliver(updateTx, () =>
    makeUpdateTx(updatePricesArgs).then((tx) => tx.data)
  );

  // is not using await to not block the main function
  updateTxResponse
    .wait()
    .then((receipt) =>
      logger.log(
        `iteration_block=${updatePricesArgs.blockTag} ${getTxReceiptDesc(receipt)}`
      )
    )
    .catch((error) => describeTxWaitError(error));

  logger.log(
    `Update prices tx delivered hash=${updateTxResponse.hash} gasLimit=${String(
      updateTxResponse.gasLimit
    )} gasPrice=${updateTxResponse.gasPrice?.toString()} maxFeePerGas=${String(
      updateTxResponse.maxFeePerGas
    )} maxPriorityFeePerGas=${String(updateTxResponse.maxPriorityFeePerGas)}`
  );
};

const makeUpdateTx = async (
  args: UpdatePricesArgs
): Promise<TxDeliveryCall> => {
  switch (config().adapterContractType) {
    case "price-feeds":
      return await makePriceFeedUpdateTx(
        args as UpdatePricesArgs<RedstoneAdapterBase>
      );
    case "multi-feed":
      return await makeMultiFeedUpdateTx(
        args as UpdatePricesArgs<MultiFeedAdapterWithoutRounds>
      );
    case "mento":
      return await makeMentoUpdateTx(
        args as UpdatePricesArgs<MentoAdapterBase>
      );
    default:
      throw new Error(
        `Unsupported adapter contract type: ${config().adapterContractType}`
      );
  }
};

const makePriceFeedUpdateTx = async ({
  adapterContract,
  fetchDataPackages,
}: UpdatePricesArgs<RedstoneAdapterBase>): Promise<TxDeliveryCall> => {
  const dataPackages = await fetchDataPackages();
  const dataPackagesWrapper = new DataPackagesWrapper<RedstoneAdapterBase>(
    dataPackages
  );
  const proposedTimestamp = chooseDataPackagesTimestamp(dataPackages);

  dataPackagesWrapper.setMetadataTimestamp(Date.now());
  const wrappedContract =
    dataPackagesWrapper.overwriteEthersContract(adapterContract);

  const txCall = convertToTxDeliveryCall(
    await wrappedContract.populateTransaction["updateDataFeedsValues"](
      proposedTimestamp
    )
  );

  return txCall;
};

const makeMultiFeedUpdateTx = async ({
  adapterContract,
  dataFeedsToUpdate,
  fetchDataPackages,
}: UpdatePricesArgs<MultiFeedAdapterWithoutRounds>): Promise<TxDeliveryCall> => {
  const dataFeedsAsBytes32 = dataFeedsToUpdate.map(utils.formatBytes32String);
  const dataPackages = await fetchDataPackages();
  const dataPackagesWrapper =
    new DataPackagesWrapper<MultiFeedAdapterWithoutRounds>(dataPackages);

  dataPackagesWrapper.setMetadataTimestamp(Date.now());
  const wrappedContract =
    dataPackagesWrapper.overwriteEthersContract(adapterContract);

  const txCall = convertToTxDeliveryCall(
    await wrappedContract.populateTransaction["updateDataFeedsValuesPartial"](
      dataFeedsAsBytes32
    )
  );

  return txCall;
};

const makeMentoUpdateTx = async ({
  adapterContract: mentoAdapter,
  fetchDataPackages,
}: UpdatePricesArgs<MentoAdapterBase>): Promise<TxDeliveryCall> => {
  const dataPackagesPromise = fetchDataPackages();
  const blockTag = await mentoAdapter.provider.getBlockNumber();

  const sortedOraclesAddress = await mentoAdapter.getSortedOracles({
    blockTag,
  });
  const sortedOracles = getSortedOraclesContractAtAddress(
    sortedOraclesAddress,
    mentoAdapter.provider
  );
  const maxDeviationAllowed = config().mentoMaxDeviationAllowed;

  const dataPackages = await dataPackagesPromise;
  const dataPackagesWrapper = new DataPackagesWrapper<MentoAdapterBase>(
    dataPackages
  );

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

  const proposedTimestamp = chooseDataPackagesTimestamp(dataPackages);

  const txCall = convertToTxDeliveryCall(
    await wrappedMentoContract.populateTransaction[
      "updatePriceValuesAndCleanOldReports"
    ](proposedTimestamp, linkedListPositions)
  );

  return txCall;
};

const getTxReceiptDesc = (receipt: TransactionReceipt) => {
  return `Transaction ${receipt.transactionHash} mined with SUCCESS(status: ${
    receipt.status
  }) in block #${receipt.blockNumber}[tx index: ${
    receipt.transactionIndex
  }]. gas_used=${receipt.gasUsed.toString()} effective_gas_price=${receipt.effectiveGasPrice.toString()}`;
};

function describeTxWaitError(error: unknown) {
  logger.error(
    `Failed to await transaction ${RedstoneCommon.stringifyError(error)}`
  );
}
