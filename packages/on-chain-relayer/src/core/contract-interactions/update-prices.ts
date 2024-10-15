import { TransactionReceipt } from "@ethersproject/providers";
import {
  TxDeliveryCall,
  convertToTxDeliveryCall,
} from "@redstone-finance/rpc-providers";
import { RedstoneCommon, loggerFactory } from "@redstone-finance/utils";
import { Contract, providers, utils } from "ethers";
import {
  MentoAdapterBase,
  MultiFeedAdapterWithoutRounds,
  RedstoneAdapterBase,
} from "../../../typechain-types";
import { config } from "../../config";
import { prepareLinkedListLocationsForMentoAdapterReport } from "../../custom-integrations/mento/mento-utils";
import { getTxDeliveryMan } from "../TxDeliveryManSingleton";

import { DataPackagesWrapper } from "@redstone-finance/evm-connector";
import { chooseDataPackagesTimestamp } from "@redstone-finance/sdk";
import { getSortedOraclesContractAtAddress } from "../../custom-integrations/mento/get-sorted-oracles-contract-at-address";
import { MultiFeedUpdatePricesArgs, UpdatePricesArgs } from "../../types";

const logger = loggerFactory("updatePrices");

export const updatePrices = async (
  updatePricesArgs: UpdatePricesArgs,
  adapterContract: Contract
) => {
  const updateTx = await makeUpdateTx(updatePricesArgs, adapterContract);

  const txDeliveryMan = getTxDeliveryMan(
    adapterContract.signer,
    adapterContract.provider as providers.JsonRpcProvider
  );

  const updateTxResponse = await txDeliveryMan.deliver(updateTx, () =>
    makeUpdateTx(updatePricesArgs, adapterContract).then((tx) => tx.data)
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
  args: UpdatePricesArgs,
  contract: Contract
): Promise<TxDeliveryCall> => {
  switch (config().adapterContractType) {
    case "price-feeds":
      return await makePriceFeedUpdateTx(args, contract as RedstoneAdapterBase);
    case "multi-feed":
      return await makeMultiFeedUpdateTx(
        args as MultiFeedUpdatePricesArgs,
        contract as MultiFeedAdapterWithoutRounds
      );
    case "mento":
      return await makeMentoUpdateTx(args, contract as MentoAdapterBase);
    default:
      throw new Error(
        `Unsupported adapter contract type: ${config().adapterContractType}`
      );
  }
};

const makePriceFeedUpdateTx = async (
  { fetchDataPackages }: UpdatePricesArgs,
  adapterContract: RedstoneAdapterBase
): Promise<TxDeliveryCall> => {
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

const makeMultiFeedUpdateTx = async (
  { dataFeedsToUpdate, fetchDataPackages }: MultiFeedUpdatePricesArgs,
  adapterContract: MultiFeedAdapterWithoutRounds
): Promise<TxDeliveryCall> => {
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

const makeMentoUpdateTx = async (
  { fetchDataPackages }: UpdatePricesArgs,
  mentoAdapter: MentoAdapterBase
): Promise<TxDeliveryCall> => {
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
