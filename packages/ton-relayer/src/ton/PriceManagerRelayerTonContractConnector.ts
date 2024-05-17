import {
  ContractParamsProvider,
  IContractConnector,
  IPriceManagerContractAdapter,
  IPricesContractAdapter,
} from "@redstone-finance/sdk";
import {
  TonNetwork,
  TonPricesContractConnector,
} from "@redstone-finance/ton-connector";
import {
  DATA_FEEDS,
  DATA_SERVICE_ID,
  UNIQUE_SIGNER_COUNT,
} from "../config/data-service-parameters";
import { PriceManagerRelayerTonContractAdapter } from "./PriceManagerRelayerTonContractAdapter";

export class PriceManagerRelayerTonContractConnector
  extends TonPricesContractConnector
  implements IContractConnector<IPriceManagerContractAdapter>
{
  private readonly paramsProvider: ContractParamsProvider;

  constructor(network: TonNetwork, address: string) {
    super(network, address);

    this.paramsProvider = new ContractParamsProvider({
      dataServiceId: DATA_SERVICE_ID,
      uniqueSignersCount: UNIQUE_SIGNER_COUNT,
      dataPackagesIds: DATA_FEEDS,
    });
  }

  override async getAdapter(): Promise<
    IPriceManagerContractAdapter & IPricesContractAdapter
  > {
    return new PriceManagerRelayerTonContractAdapter(
      await this.getContract(),
      this.paramsProvider
    );
  }
}
