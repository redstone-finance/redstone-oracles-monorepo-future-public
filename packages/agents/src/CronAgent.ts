import {
  loggerFactory,
  RedstoneCommon,
  RedstoneLogger,
} from "@redstone-finance/utils";
import { Job, scheduleJob } from "node-schedule";

type CachedResult<R> = { cachedAt: number; value?: R };

export type CronAgentArgs<R> = {
  job: () => Promise<R>;
  name: string;
  cronExpression: string;
  maxDataTTL: number;
  timeout: number;
};

export class CronAgent<R> {
  private cachedValue: CachedResult<R>;
  readonly logger: RedstoneLogger;

  private inProgress = false;
  private schedulerTask?: Job;

  constructor(private args: CronAgentArgs<R>) {
    this.cachedValue = { cachedAt: 0 };
    this.logger = loggerFactory(`agent-${args.name}`);
  }

  /**
   * Will block until first iteration will resolve or reject
   * Return false if rejected, true if succeded (you can implement own retry logic if needed)
   */
  async start() {
    let hasSucceded = true;

    try {
      await this.executeJobAndSaveResults();
    } catch (e) {
      this.logger.error(
        `Failed to initialize agent with first value error=${RedstoneCommon.stringifyError(e)}`
      );
      hasSucceded = false;
    }

    if (this.schedulerTask) {
      this.logger.warn(
        "Prevent from creating setInterval twice for same agent"
      );
      return true;
    }

    this.schedulerTask = scheduleJob(this.args.cronExpression, async () => {
      try {
        await this.executeJobAndSaveResults();
      } catch (e) {
        this.logger.warn(
          `Agent job failed error=${RedstoneCommon.stringifyError(e)}`
        );
      }
    });

    return hasSucceded;
  }

  stop() {
    if (this.schedulerTask) {
      this.schedulerTask.cancel(false);
    } else {
      this.logger.warn("Tried to stop never started agent");
    }
  }

  /** throws if cached value is not fresh */
  getLastFreshMessageOrFail(): R {
    if (this.isStale() || !this.cachedValue.value) {
      throw new Error(
        `Cached data is stale or not populated cachedAt=${this.cachedValue.cachedAt} maxDataTTL=${this.args.maxDataTTL} cache_age=${Date.now() - this.cachedValue.cachedAt}`
      );
    }
    return this.cachedValue.value;
  }

  /** return defaultValue if value is not fresh */
  getLastFreshMessageOrDefault(defaultValue?: R): R | undefined {
    if (this.isStale()) {
      return defaultValue;
    }

    return this.cachedValue.value;
  }

  private isStale() {
    return Date.now() - this.cachedValue.cachedAt > this.args.maxDataTTL;
  }

  private async executeJobAndSaveResults() {
    // it has to be outside of try/catch block to avoid getting in finally block
    if (this.inProgress) {
      this.logger.debug(
        "skipping deferredFetchData, because previous is still in progress"
      );
      return;
    }

    try {
      this.inProgress = true;
      const result = await RedstoneCommon.timeout(
        this.args.job(),
        this.args.timeout
      );

      this.cachedValue = { cachedAt: Date.now(), value: result };
    } finally {
      this.inProgress = false;
    }
  }
}
