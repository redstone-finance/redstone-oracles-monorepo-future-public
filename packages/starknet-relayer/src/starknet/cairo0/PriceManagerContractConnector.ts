import {
  ContractParamsProvider,
  IPriceManagerContractAdapter,
} from "@redstone-finance/sdk";
import { StarknetContractParamsProvider } from "@redstone-finance/starknet-connector";
import { StarknetRelayerConfig } from "../../config";
import {
  DATA_FEEDS,
  DATA_SERVICE_ID,
  UNIQUE_SIGNER_COUNT,
} from "../../config/data-service-parameters";
import price_manager_abi from "../../config/price_manager_abi.json";
import { RelayerStarknetContractConnector } from "../RelayerStarknetContractConnector";
import { PriceManagerContractAdapter } from "./PriceManagerContractAdapter";

export class PriceManagerContractConnector extends RelayerStarknetContractConnector<IPriceManagerContractAdapter> {
  private readonly paramsProvider: ContractParamsProvider;

  constructor(config: StarknetRelayerConfig) {
    super(price_manager_abi, config);

    this.paramsProvider = new StarknetContractParamsProvider({
      dataServiceId: DATA_SERVICE_ID,
      uniqueSignersCount: UNIQUE_SIGNER_COUNT,
      dataFeeds: DATA_FEEDS,
    });
  }

  getAdapter(): Promise<IPriceManagerContractAdapter> {
    return Promise.resolve(
      new PriceManagerContractAdapter(
        this.getContract(),
        this.paramsProvider,
        this.config.maxEthFee
      )
    );
  }
}
