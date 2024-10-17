import axios from "axios";

export const FUEL_BASE_GAS_LIMIT = 1000000;

export interface Block {
  height: string;
  time: string;
}

export class FuelConnector {
  constructor(
    protected providerUrl?: string,
    protected gasLimit = FUEL_BASE_GAS_LIMIT
  ) {}

  getGasLimit(): number {
    return this.gasLimit;
  }

  async getBlockNumber(): Promise<number> {
    return Number((await this.getLatestBlock()).height);
  }

  async getLatestBlock(): Promise<Block> {
    const LATEST_BLOCK_QUERY =
      "query LatestBlockHeight { chain { latestBlock {  header { height, time } } } }";

    const response = await axios({
      url: this.providerUrl!,
      method: "POST",
      data: { query: LATEST_BLOCK_QUERY },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return response.data.data.chain.latestBlock.header;
  }
}
