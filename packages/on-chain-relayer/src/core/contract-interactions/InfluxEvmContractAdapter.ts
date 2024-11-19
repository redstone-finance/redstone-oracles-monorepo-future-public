import { ContractParamsProvider } from "@redstone-finance/sdk";
import { RedstoneEvmContract } from "../../facade/EvmContractFacade";
import { RelayerDataInfluxService } from "../../facade/RelayerDataInfluxService";
import { ContractData, RelayerConfig } from "../../types";
import { EvmContractAdapter } from "./EvmContractAdapter";
import { TxDeliveryCall } from "./tx-delivery-gelato-bypass";

const RELAYER_DATA_BUCKET = "dry-run-relayer-data";

export class InfluxEvmContractAdapter<
  Contract extends RedstoneEvmContract,
> extends EvmContractAdapter<Contract> {
  private influxService: RelayerDataInfluxService;

  constructor(
    private wrappedAdapter: EvmContractAdapter<Contract>,
    relayerConfig: RelayerConfig
  ) {
    const { influxUrl, influxToken } = relayerConfig;

    super(wrappedAdapter.adapterContract);

    this.influxService = new RelayerDataInfluxService({
      url: influxUrl!,
      token: influxToken!,
      bucketName: RELAYER_DATA_BUCKET,
      orgName: "redstone",
    });
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
