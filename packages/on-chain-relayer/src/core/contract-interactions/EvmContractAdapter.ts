import { TransactionReceipt } from "@ethersproject/providers";
import { ContractParamsProvider } from "@redstone-finance/sdk";
import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";
import { RelayerConfig } from "../../config/RelayerConfig";
import { RedstoneEvmContract } from "../../facade/EvmContractFacade";
import { ContractData } from "../../types";
import { IRedstoneContractAdapter } from "./IRedstoneContractAdapter";
import { ITxDeliveryMan, TxDeliveryCall } from "./tx-delivery-gelato-bypass";

const logger = loggerFactory("evm-contract-adapter");

export abstract class EvmContractAdapter<Contract extends RedstoneEvmContract>
  implements IRedstoneContractAdapter
{
  constructor(
    public relayerConfig: RelayerConfig,
    public adapterContract: Contract,
    protected txDeliveryMan?: ITxDeliveryMan
  ) {}

  abstract makeUpdateTx(
    paramsProvider: ContractParamsProvider,
    metadataTimestamp: number
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
    const metadataTimestamp = Date.now();
    const updateTx = await this.makeUpdateTx(paramsProvider, metadataTimestamp);

    const updateTxResponse = await this.txDeliveryMan?.deliver(updateTx, () =>
      this.makeUpdateTx(paramsProvider, metadataTimestamp).then((tx) => tx.data)
    );

    if (!updateTxResponse) {
      // nothing wrong: we are probably in Gelato env or another custom txDeliveryMan is provided
      return;
    }

    // is not using await to not block the main function
    updateTxResponse
      .wait()
      .then((receipt) => logger.log(getTxReceiptDesc(receipt), { receipt }))
      .catch((error) =>
        logger.error(
          `Failed to await transaction ${RedstoneCommon.stringifyError(error)}`
        )
      );

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
