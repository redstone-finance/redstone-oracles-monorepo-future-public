import { StarknetContractConnector } from "@redstone-finance/starknet-connector";
import { Abi, Account, ec, Provider, Signer } from "starknet";

export abstract class StarknetRelayerContractConnector extends StarknetContractConnector {
  protected constructor(
    abi: Abi,
    protected config: any,
    contractAddress?: string
  ) {
    const provider = new Provider({ sequencer: { network: config.network } });

    const account = new Account(
      provider,
      config.ownerAddress,
      new Signer(ec.getKeyPair(config.privateKey))
    );

    super(account, contractAddress || config.managerAddress, abi);
  }
}
