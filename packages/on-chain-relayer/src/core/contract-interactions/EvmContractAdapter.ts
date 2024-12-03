import { ContractParamsProvider } from "@redstone-finance/sdk";
import { Tx } from "@redstone-finance/utils";
import { RelayerConfig } from "../../config/RelayerConfig";
import { RedstoneEvmContract } from "../../facade/EvmContractFacade";
import { ContractData } from "../../types";
import { IRedstoneContractAdapter } from "./IRedstoneContractAdapter";
import { RelayerTxDeliveryManContext } from "./RelayerTxDeliveryManContext";

export abstract class EvmContractAdapter<Contract extends RedstoneEvmContract>
  implements IRedstoneContractAdapter
{
  constructor(
    public relayerConfig: RelayerConfig,
    public adapterContract: Contract,
    protected txDeliveryMan: Tx.ITxDeliveryMan
  ) {}

  abstract makeUpdateTx(
    paramsProvider: ContractParamsProvider,
    metadataTimestamp: number
  ): Promise<Tx.TxDeliveryCall>;

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

    await this.txDeliveryMan.deliver(updateTx, {
      deferredCallData: () =>
        this.makeUpdateTx(paramsProvider, metadataTimestamp).then(
          (tx) => tx.data
        ),
      paramsProvider,
    } as RelayerTxDeliveryManContext);
  }
}
