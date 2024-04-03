import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { KeyPair } from "@ton/crypto/dist/primitives/nacl";
import {
  Address,
  Contract,
  OpenedContract,
  Sender,
  TonClient,
  TonClient4,
  WalletContractV4,
} from "@ton/ton";
import assert from "assert";
import { AnyTonOpenedContract, TonApiV2Config, TonNetwork } from "./TonNetwork";

export class CustomTonNetwork implements TonNetwork {
  api?: TonClient4;
  oldApi?: TonClient;
  sender?: Sender;
  walletContract?: OpenedContract<WalletContractV4>;
  walletAddress?: Address;

  constructor(
    private walletKeyProvider: () => Promise<KeyPair | undefined>,
    private apiV2Config: TonApiV2Config,
    public workchain = 0
  ) {}

  async setUp() {
    const walletKey = await this.walletKeyProvider();

    assert(walletKey, "Wallet key is undefined!");

    const endpoint = await getHttpV4Endpoint({ network: "testnet" });

    const wallet = WalletContractV4.create({
      publicKey: walletKey.publicKey,
      workchain: this.workchain,
    });

    this.api = new TonClient4({ endpoint });
    this.oldApi = new TonClient(this.apiV2Config);

    this.walletContract = this.oldApi.open(wallet);
    this.sender = this.walletContract.sender(walletKey.secretKey);
    this.walletAddress = wallet.address;
  }

  async isContractDeployed(address?: Address): Promise<boolean> {
    return (
      address != undefined && (await this.oldApi!.isContractDeployed(address))
    );
  }

  open<T extends Contract>(contract: T): AnyTonOpenedContract<T> {
    return this.api!.open(contract);
  }
}
