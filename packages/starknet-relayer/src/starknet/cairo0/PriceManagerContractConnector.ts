import {
  ContractParamsProvider,
  IContractConnector,
  IPriceManagerContractAdapter,
} from "redstone-sdk";
import price_manager_abi from "../../config/price_manager_abi.json";
import { StarknetContractParamsProvider } from "@redstone-finance/starknet-connector";
import { PriceManagerContractAdapter } from "./PriceManagerContractAdapter";
import { RelayerStarknetContractConnector } from "../RelayerStarknetContractConnector";
import {
  DATA_FEEDS,
  DATA_SERVICE_ID,
  UNIQUE_SIGNER_COUNT,
} from "../../config/data-service-parameters";

export class PriceManagerContractConnector
  extends RelayerStarknetContractConnector
  implements IContractConnector<IPriceManagerContractAdapter>
{
  private readonly paramsProvider: ContractParamsProvider;

  constructor(config: any) {
    super(price_manager_abi, config);

    this.paramsProvider = new StarknetContractParamsProvider({
      dataServiceId: DATA_SERVICE_ID,
      uniqueSignersCount: UNIQUE_SIGNER_COUNT,
      dataFeeds: DATA_FEEDS,
    });
  }

  async getAdapter(): Promise<IPriceManagerContractAdapter> {
    return new PriceManagerContractAdapter(
      this.getContract(),
      this.paramsProvider,
      this.config.maxEthFee
    );
  }
}
