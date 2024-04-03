import { Address, Contract, Sender } from "@ton/core";
import { SandboxContract } from "@ton/sandbox";
import { OpenedContract, TonClient, TonClient4 } from "@ton/ton";

export type AnyTonOpenedContract<T> = OpenedContract<T> | SandboxContract<T>;

export interface TonNetwork {
  sender?: Sender;
  api?: TonClient4;
  oldApi?: TonClient;
  workchain: number;
  walletAddress?: Address;

  setUp(): Promise<void>;

  open<T extends Contract>(contract: T): AnyTonOpenedContract<T>;

  isContractDeployed(address?: Address): Promise<boolean>;
}

export interface TonApiV2Config {
  endpoint: string;
  apiKey?: string;
}
