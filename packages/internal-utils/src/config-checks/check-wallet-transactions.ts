import { RedstoneCommon } from "@redstone-finance/utils";
import { RedStoneTxStatsInfluxService } from "./RedStoneTxStatsInfluxService";
import {
  ICommonRelayerManifest,
  IWalletsToMonitorConfig,
  TransactionStats,
  UpdaterType,
  updaterTypes,
} from "./types";

const DAY_RANGES = [7, 31, 366, 2000];
const TRANSACTION_LIMIT = 100;

export type BalanceCheckFunction = (
  wallet: IWalletsToMonitorConfig,
  type: UpdaterType,
  stats: TransactionStats,
  prefix: string
) => void;

export async function checkWalletTransactions(
  txStatsInfluxService: RedStoneTxStatsInfluxService,
  manifest: ICommonRelayerManifest,
  walletsToMonitor: IWalletsToMonitorConfig[],
  relayerId: string,
  balanceCheckFunction?: BalanceCheckFunction
) {
  console.log(
    `--------------------------------------------------------------------------------------------------\n` +
      `[${relayerId}] Checking wallet transactions for adapter ${manifest.adapterContract} on chain ${manifest.chain.id}`
  );

  let mainWalletStats: TransactionStats | undefined = undefined;
  for (let i = 0; i < walletsToMonitor.length; i++) {
    const type = castIndexToUpdaterType(i);
    if (!type) {
      throw new Error(`Unknown wallet type for index: ${i}`);
    }
    const prefix = `[${relayerId}] > [${type}] * `;
    const wallet = walletsToMonitor[i];
    console.log(`${prefix}Checking wallet ${wallet.address}`);

    if (wallet.skipCheckingTransactions) {
      console.log(
        `${prefix}Skipping because \`skipCheckingTransactions: true\` is set`
      );

      continue;
    }

    const stats = await aggregateWalletTransactions(
      wallet,
      manifest,
      txStatsInfluxService,
      type === UpdaterType.main,
      prefix
    );

    if (type === UpdaterType.main) {
      mainWalletStats = stats;
    }

    if (!balanceCheckFunction) {
      continue;
    }

    balanceCheckFunction(wallet, type, mainWalletStats!, prefix);
  }
}

async function aggregateWalletTransactions(
  wallet: { address: string; minBalance?: string },
  manifest: ICommonRelayerManifest,
  txStatsInfluxService: RedStoneTxStatsInfluxService,
  failIfEmpty: boolean,
  prefix: string
): Promise<TransactionStats> {
  let maxCount = 0;

  for (const daysRange of DAY_RANGES) {
    const { count, mean, stdDev, avgInterval, median } =
      await txStatsInfluxService.getTransactionStats(
        manifest.chain.id,
        wallet.address,
        manifest.adapterContract,
        daysRange,
        TRANSACTION_LIMIT
      );

    maxCount = Math.max(maxCount, count);

    if (maxCount == 0) {
      continue;
    }

    console.debug(
      `${prefix}Fetched ${count} indexed transaction(s), ` +
        `avg gas cost: ${RedstoneCommon.roundToSignificantDigits(mean)} +/- ${RedstoneCommon.roundToSignificantDigits(stdDev)} ` +
        `(median: ${RedstoneCommon.roundToSignificantDigits(median)}) in range of ${daysRange} days`
    );

    return { mean, stdDev, median, avgInterval };
  }

  const message = `${prefix}No indexed transaction found in range of ${DAY_RANGES[DAY_RANGES.length - 1]} days!`;

  if (failIfEmpty) {
    console.error(message);
    throw new Error(message);
  } else {
    console.warn(message);
  }

  return { mean: 0, stdDev: 0, median: 0 };
}

function castIndexToUpdaterType(index: number) {
  if (index >= 0 && index < updaterTypes.length) {
    return updaterTypes[index] as UpdaterType;
  }
  return undefined;
}
