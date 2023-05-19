import axios from "axios";

export const FUEL_BASE_GAS_LIMIT = 500000000;

export interface Block {
  height: string;
  time: string;
}

export class FuelConnector {
  constructor(protected providerUrl: string | undefined) {}

  getGasLimit(): number {
    return !!this.providerUrl?.indexOf("127.0.0.1") ? 0 : FUEL_BASE_GAS_LIMIT;
  }

  async getBlockNumber(): Promise<number> {
    return Number((await this.getLatestBlock()).height);
  }

  async getLatestBlock(): Promise<Block> {
    const LATEST_BLOCK_QUERY =
      "query LatestBlockHeight { chain { latestBlock {  header { height, time } } } }";

    const response = await axios({
      url: this.providerUrl,
      method: "POST",
      data: { query: LATEST_BLOCK_QUERY },
    });

    return response.data.data.chain.latestBlock.header;
  }
}
