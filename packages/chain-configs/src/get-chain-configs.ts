import {
  GenericMonitoringManifest,
  getRemoteMonitoringManifestConfigFromEnv,
  resolveMonitoringManifest,
} from "@redstone-finance/internal-utils";
import { RedstoneCommon } from "@redstone-finance/utils";
import localChainConfigsManifest from "../manifest/chain-configs.json";
import { ChainConfigs, ChainConfigsById, ChainConfigsSchema } from "./schemes";

const fetchChainConfigsWithAxios = async (
  manifestsHosts: string[],
  apikey?: string,
  gitref = "main"
) => {
  for (const manifestsHost of manifestsHosts) {
    const manifestUrl = `https://${manifestsHost}/redstone-finance/redstone-monorepo-priv/${gitref}/packages/chain-configs/manifest/chain-configs.json`;
    try {
      const response = await RedstoneCommon.axiosGetWithRetries<
        GenericMonitoringManifest<ChainConfigs>
      >(manifestUrl, { maxRetries: 2, headers: { apikey } });
      return response.data;
    } catch (e) {
      console.log(
        `failed to fetch chain configs from URL ${manifestUrl}, error ${RedstoneCommon.stringifyError(e)}`
      );
    }
  }
  throw new Error(
    `failed to fetch chain configs for ${JSON.stringify({ manifestsHosts, apikey })}`
  );
};

const fetchChainConfigsWithCache = RedstoneCommon.memoize({
  functionToMemoize: fetchChainConfigsWithAxios,
  ttl: RedstoneCommon.minToMs(1),
});

export async function fetchChainConfigs(): Promise<ChainConfigs> {
  const config = getRemoteMonitoringManifestConfigFromEnv();

  if (config.shouldUseLocal) {
    return getLocalChainConfigs();
  }

  const chainConfigsManifest = await fetchChainConfigsWithCache(
    config.manifestsHosts,
    config.manifestsApiKey,
    config.manifestsGitRef
  );
  const resolvedManifest = resolveMonitoringManifest(chainConfigsManifest);

  return ChainConfigsSchema.parse(resolvedManifest);
}

const LOCAL_CHAIN_CONFIGS = ChainConfigsSchema.parse(
  resolveMonitoringManifest(localChainConfigsManifest)
);

const LOCAL_CHAIN_CONFIGS_BY_CHAIN_ID =
  groupChainConfigsById(LOCAL_CHAIN_CONFIGS);

export function getLocalChainConfigsByChainId(): ChainConfigsById {
  return LOCAL_CHAIN_CONFIGS_BY_CHAIN_ID;
}

export function getLocalChainConfigs(): ChainConfigs {
  return LOCAL_CHAIN_CONFIGS;
}

function groupChainConfigsById(chainConfigs: ChainConfigs): ChainConfigsById {
  const entries = Object.values(chainConfigs).map((chain) => [
    chain.chainId,
    chain,
  ]);
  return Object.fromEntries(entries) as ChainConfigsById;
}
