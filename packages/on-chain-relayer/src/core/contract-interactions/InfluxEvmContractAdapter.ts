import { ContractParamsProvider } from "@redstone-finance/sdk";
import { RelayerConfig } from "../../config/RelayerConfig";
import { RedstoneEvmContract } from "../../facade/EvmContractFacade";
import { RelayerDataInfluxService } from "../../facade/RelayerDataInfluxService";
import { ContractData } from "../../types";
import { EvmContractAdapter } from "./EvmContractAdapter";
import { TxDeliveryCall } from "./tx-delivery-gelato-bypass";

export class InfluxEvmContractAdapter<
  Contract extends RedstoneEvmContract,
> extends EvmContractAdapter<Contract> {
  private influxService: RelayerDataInfluxService;

  constructor(
    private wrappedAdapter: EvmContractAdapter<Contract>,
    relayerConfig: RelayerConfig
  ) {
    super(relayerConfig, wrappedAdapter.adapterContract);

    this.influxService = new RelayerDataInfluxService(relayerConfig);
  }

  override async readLatestRoundParamsFromContract(
    feedIds: string[],
    blockNumber: number
  ): Promise<ContractData> {
    return await this.wrappedAdapter.readLatestRoundParamsFromContract(
      feedIds,
      blockNumber
    );
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  makeUpdateTx(
    _paramsProvider: ContractParamsProvider,
    _metadataTimestamp: number = Date.now()
  ): Promise<TxDeliveryCall> {
    throw new Error("Path not supported");
  }

  override async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ) {
    await this.influxService.updatePriceValues(paramsProvider);
  }
}
