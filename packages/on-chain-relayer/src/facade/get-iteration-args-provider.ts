import { canIgnoreMissingFeeds } from "../core/make-data-packages-request-params";
import { getMultiFeedIterationArgs } from "../multi-feed/args/get-multi-feed-iteration-args";
import { getIterationArgs } from "../price-feeds/args/get-iteration-args";
import { IterationArgs, RelayerConfig, ShouldUpdateContext } from "../types";

export type IterationArgsProvider = (
  context: ShouldUpdateContext,
  relayerConfig: RelayerConfig
) => Promise<IterationArgs>;

export function getIterationArgsProvider(
  relayerConfig: RelayerConfig
): IterationArgsProvider {
  return canIgnoreMissingFeeds(relayerConfig)
    ? getMultiFeedIterationArgs
    : getIterationArgs;
}
