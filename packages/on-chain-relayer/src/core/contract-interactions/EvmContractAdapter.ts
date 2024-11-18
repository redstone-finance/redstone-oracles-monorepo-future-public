import { TransactionReceipt } from "@ethersproject/providers";
import { ContractParamsProvider } from "@redstone-finance/sdk";
import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";
import { RedstoneEvmContract } from "../../facade/EvmContractFacade";
import { ContractData } from "../../types";
import { IRedstoneContractAdapter } from "./IRedstoneContractAdapter";
import { ITxDeliveryMan, TxDeliveryCall } from "./tx-delivery-gelato-fixes";

const logger = loggerFactory("evm-contract-adapter");

export abstract class EvmContractAdapter<Contract extends RedstoneEvmContract>
  implements IRedstoneContractAdapter
{
  constructor(
    public adapterContract: Contract,
    protected txDeliveryMan?: ITxDeliveryMan
  ) {}

  abstract makeUpdateTx(
    paramsProvider: ContractParamsProvider
  ): Promise<TxDeliveryCall>;

  abstract readLatestRoundParamsFromContract(
    feedIds: string[],
    blockNumber: number
  ): Promise<ContractData>;

  async getUniqueSignerThreshold(blockTag?: number): Promise<number> {
    return await this.adapterContract.getUniqueSignersThreshold({ blockTag });
  }

  async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ) {
    const updateTx = await this.makeUpdateTx(paramsProvider);

    const updateTxResponse = await this.txDeliveryMan?.deliver(updateTx, () =>
      this.makeUpdateTx(paramsProvider).then((tx) => tx.data)
    );

    if (!updateTxResponse) {
      return logger.info(
        "updateTxResponse is undefined - we are probably in Gelato env"
      );
    }

    // is not using await to not block the main function
    updateTxResponse
      .wait()
      .then((receipt) =>
        logger.log(
          `iteration_block=${receipt.blockNumber} ${getTxReceiptDesc(receipt)}`
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
  }
}

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
