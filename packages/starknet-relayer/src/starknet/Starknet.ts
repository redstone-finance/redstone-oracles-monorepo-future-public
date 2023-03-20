import { ContractDataProvider } from "redstone-sdk";
import { Signer, Account, ec, Provider } from "starknet";
import {
  LatestRoundDataCommand,
  ReadRoundDataCommand,
  WritePricesCommand,
} from "./starknet-commands";
import { StarknetCommand } from "./StarknetCommand";
import price_manager_abi from "../config/price_manager_abi.json";
import price_feed_abi from "../config/price_feed_abi.json";

const WAIT_FOR_TRANSACTION_TIME_INTERVAL = 30103;
const DATA_SERVICE_ID = "redstone-avalanche-prod";
const UNIQUE_SIGNER_COUNT = 1;

export class Starknet {
  private readonly dataProvider: ContractDataProvider;
  private readonly account: Account;
  private readonly provider: Provider;
  private readonly contractAddress: string;

  constructor(private config: any) {
    this.contractAddress = config.contractAddress;
    this.provider = new Provider({ sequencer: { network: config.network } });
    this.dataProvider = new ContractDataProvider({
      dataServiceId: DATA_SERVICE_ID,
      uniqueSignersCount: UNIQUE_SIGNER_COUNT,
      dataFeeds: ["ETH", "BTC"],
    });

    this.account = new Account(
      this.provider,
      config.ownerAddress,
      new Signer(ec.getKeyPair(config.privateKey))
    );
  }

  waitForTransaction(txHash: string) {
    return this.provider.waitForTransaction(
      txHash,
      WAIT_FOR_TRANSACTION_TIME_INTERVAL,
      ["ACCEPTED_ON_L2", "REJECTED"]
    );
  }

  readTimestampAndRoundCommand(): StarknetCommand {
    return new ReadRoundDataCommand(
      price_manager_abi,
      this.config.managerAddress,
      this.account
    );
  }

  writePricesCommand(round: number): StarknetCommand {
    return new WritePricesCommand(
      price_manager_abi,
      this.config.managerAddress,
      this.account,
      this.config.maxEthFee,
      this.dataProvider,
      round
    );
  }

  latestRoundCommand(feedAddress: string): StarknetCommand {
    return new LatestRoundDataCommand(
      price_feed_abi,
      feedAddress,
      this.account
    );
  }
}
