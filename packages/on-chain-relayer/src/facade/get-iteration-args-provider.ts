import { canIgnoreMissingFeeds } from "../core/make-data-packages-request-params";
import { getMultiFeedIterationArgs } from "../multi-feed/args/get-multi-feed-iteration-args";
import { getIterationArgs } from "../price-feeds/args/get-iteration-args";
import { RelayerConfig } from "../types";

export function getIterationArgsProvider(relayerConfig: RelayerConfig) {
  return canIgnoreMissingFeeds(relayerConfig)
    ? getMultiFeedIterationArgs
    : getIterationArgs;
}
