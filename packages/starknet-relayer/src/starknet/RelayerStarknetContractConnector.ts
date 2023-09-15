import { StarknetContractConnector } from "@redstone-finance/starknet-connector";
import { Abi, Account, Provider, Signer } from "starknet";
import { StarknetRelayerConfig } from "../config";

export abstract class RelayerStarknetContractConnector<
  Adapter,
> extends StarknetContractConnector<Adapter> {
  protected constructor(
    abi: Abi,
    protected config: StarknetRelayerConfig,
    contractAddress?: string
  ) {
    const provider = new Provider({ sequencer: { network: config.network } });

    const account = new Account(
      provider,
      config.ownerAddress,
      new Signer(config.privateKey)
    );

    super(account, contractAddress || config.priceManagerAddress, abi);
  }
}
