import { RelayerConfig } from "../../types";

export const includeSynchronizedHeartbeatUpdates = (
  dataFeedsToUpdate: string[],
  heartbeatUpdates: number[],
  config: RelayerConfig
) => {
  const { multiFeedSyncHeartbeats } = config;
  if (!multiFeedSyncHeartbeats || heartbeatUpdates.length === 0) {
    return {
      dataFeedsToUpdate,
      message: "",
    };
  }
  const { dataFeeds, updateTriggers } = config;
  const messages: string[] = [];
  for (const dataFeedId of dataFeeds) {
    if (
      !updateTriggers[dataFeedId].timeSinceLastUpdateInMilliseconds ||
      dataFeedsToUpdate.includes(dataFeedId)
    ) {
      continue;
    }
    for (const heartbeat of heartbeatUpdates) {
      if (
        heartbeat %
          updateTriggers[dataFeedId].timeSinceLastUpdateInMilliseconds ===
        0
      ) {
        messages.push(
          `DataFeed: ${dataFeedId} included due to heartbeat syncing`
        );
        dataFeedsToUpdate.push(dataFeedId);
        break;
      }
    }
  }
  return {
    dataFeedsToUpdate,
    message: messages.join("; "),
  };
};
