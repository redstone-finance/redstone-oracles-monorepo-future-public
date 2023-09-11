import { StarknetContractConnector } from "@redstone-finance/starknet-connector";
import { Abi, Account, Provider, Signer } from "starknet";

export abstract class RelayerStarknetContractConnector extends StarknetContractConnector {
  protected constructor(
    abi: Abi,
    protected config: any,
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
