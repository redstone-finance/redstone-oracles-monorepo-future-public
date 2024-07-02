import { TransactionReceipt } from "@ethersproject/providers";
import { DataPackagesWrapper } from "@redstone-finance/evm-connector";
import {
  TxDeliveryCall,
  convertToTxDeliveryCall,
} from "@redstone-finance/rpc-providers";
import { DataPackagesResponse } from "@redstone-finance/sdk";
import { RedstoneCommon, loggerFactory } from "@redstone-finance/utils";
import { providers, utils } from "ethers";
import { MultiFeedAdapterWithoutRounds } from "../../../typechain-types";
import { getTxDeliveryMan } from "./TxDeliveryManSingleton";

const logger = loggerFactory("updatePrices");

export const updatePrices = async (
  adapterContract: MultiFeedAdapterWithoutRounds,
  blockTag: number,
  dataFeedsToUpdate: string[],
  fetchDataPackages: () => Promise<DataPackagesResponse>
) => {
  const updateTx = await makeUpdateTx(
    adapterContract,
    dataFeedsToUpdate,
    fetchDataPackages
  );

  const txDeliveryMan = getTxDeliveryMan(
    adapterContract.signer,
    adapterContract.provider as providers.JsonRpcProvider
  );

  const updateTxResponse = await txDeliveryMan.deliver(updateTx, () =>
    makeUpdateTx(adapterContract, dataFeedsToUpdate, fetchDataPackages).then(
      (tx) => tx.data
    )
  );

  // is not using await to not block the main function
  updateTxResponse
    .wait()
    .then((receipt) =>
      logger.log(`iteration_block=${blockTag} ${getTxReceiptDesc(receipt)}`)
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
  adapterContract: MultiFeedAdapterWithoutRounds,
  dataFeedsToUpdate: string[],
  fetchDataPackages: () => Promise<DataPackagesResponse>
): Promise<TxDeliveryCall> => {
  const dataFeedsAsBytes32 = dataFeedsToUpdate.map(utils.formatBytes32String);
  const dataPackages = await fetchDataPackages();
  logger.log("Data packages in update", JSON.stringify(dataPackages, null, 2));
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
