import { TonClient, TonClient4 } from "ton";
import { Address, Contract, OpenedContract, Sender } from "ton-core";
import { SandboxContract } from "@ton-community/sandbox";

export interface TonNetwork {
  sender?: Sender;
  api?: TonClient4;
  oldApi?: TonClient;
  workchain: number;

  setUp(): Promise<void>;

  open<T extends Contract>(contract: T): OpenedContract<T> | SandboxContract<T>;

  isContractDeployed(address?: Address): Promise<boolean>;
}

export interface TonApiV2Config {
  endpoint: string;
  apiKey?: string;
}
