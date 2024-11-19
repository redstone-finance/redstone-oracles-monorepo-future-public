import { Provider } from "@ethersproject/abstract-provider";
import { CronAgent } from "@redstone-finance/agents";
import { RedstoneCommon } from "@redstone-finance/utils";

export type BackgroundBlockNumbersFetcherOpts = {
  /** [chainId,getBlockNumber] */
  blockNumbersFetchers: [string, IGetBlockNumber][];
  timeout: number;
  maxTTL: number;
  cronExpression: string;
};

type IGetBlockNumber = Pick<Provider, "getBlockNumber">;

export class BackgroundBlockNumberFetcher {
  agentPerChainId: Record<string, CronAgent<number>> = {};

  constructor(private readonly opts: BackgroundBlockNumbersFetcherOpts) {
    for (const [chainId, blockNumberFetcher] of this.opts
      .blockNumbersFetchers) {
      const jobWithRetries = RedstoneCommon.retry({
        fn: () => blockNumberFetcher.getBlockNumber(),
        maxRetries: 1,
        waitBetweenMs: 50,
      });
      const agent = new CronAgent({
        job: jobWithRetries,
        name: `background-block-number-fetcher-${chainId}`,
        timeout: this.opts.timeout,
        maxDataTTL: this.opts.maxTTL,
        cronExpression: this.opts.cronExpression,
      });
      this.agentPerChainId[chainId] = agent;
    }
  }

  start(): Promise<boolean[]> {
    return Promise.all(
      Object.values(this.agentPerChainId).map((agent) => agent.start())
    );
  }

  stop() {
    Object.values(this.agentPerChainId).forEach((agent) => agent.stop());
  }

  getBlockNumbers(): Record<string, number | undefined> {
    const blockNumbersPerChainid: Record<string, number | undefined> = {};

    for (const [chainId, agent] of Object.entries(this.agentPerChainId)) {
      const blockNumber = agent.getLastFreshMessageOrDefault();

      if (blockNumber !== undefined) {
        blockNumbersPerChainid[chainId] = blockNumber;
      }
    }

    return blockNumbersPerChainid;
  }
}
