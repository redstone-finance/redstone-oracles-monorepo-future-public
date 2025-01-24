import { SuiClient } from "@mysten/sui/client";
import { Keypair } from "@mysten/sui/cryptography";
import type { IContractConnector } from "@redstone-finance/sdk";
import { SuiConfig } from "./config";
import { SuiContractConnector } from "./SuiContractConnector";
import { SuiPricesContractAdapter } from "./SuiPricesContractAdapter";

export class SuiPricesContractConnector
  extends SuiContractConnector<SuiPricesContractAdapter>
  implements IContractConnector<SuiPricesContractAdapter>
{
  constructor(
    client: SuiClient,
    private readonly config: SuiConfig,
    private readonly keypair?: Keypair
  ) {
    super(client);
  }

  override getAdapter(): Promise<SuiPricesContractAdapter> {
    return Promise.resolve(
      new SuiPricesContractAdapter(this.client, this.config, this.keypair)
    );
  }
}
