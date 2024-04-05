import { Account, RpcProvider, Signer } from "starknet";

export interface StarknetConfig {
  rpcUrl: string;
  ownerAddress: string;
  privateKey: string;
}

export function getAccount(config: StarknetConfig) {
  return new Account(
    new RpcProvider({ nodeUrl: config.rpcUrl }),
    config.ownerAddress,
    new Signer(config.privateKey)
  );
}
