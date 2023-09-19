import {
  ContractParamsProvider,
  IPriceManagerContractAdapter,
  PriceManagerMetadata,
} from "@redstone-finance/sdk";
import {
  AnyTonOpenedContract,
  TonPriceManager,
  TonPricesContractAdapter,
} from "@redstone-finance/ton-connector";

export class PriceManagerRelayerTonContractAdapter
  extends TonPricesContractAdapter
  implements IPriceManagerContractAdapter
{
  constructor(
    contract: AnyTonOpenedContract<TonPriceManager>,
    private readonly paramsProvider: ContractParamsProvider
  ) {
    super(contract);
  }

  async readTimestampAndRound(): Promise<PriceManagerMetadata> {
    const timestamp = await this.readTimestampFromContract();

    return {
      payload_timestamp: timestamp,
    };
  }

  async writePrices(_: number): Promise<string> {
    await this.writePricesFromPayloadToContract(this.paramsProvider);

    return "";
  }
}
