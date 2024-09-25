import { Manifest, resolveManifest } from "@redstone-finance/internal-utils";
import { RedstoneCommon } from "@redstone-finance/utils";
import { z } from "zod";
import localChainConfigsManifest from "../manifest/chain-configs.json";
import { ChainConfigs, ChainConfigsSchema } from "./schemes";

const fetchChainConfigsWithAxios = async (
  manifestsHosts: string[],
  apikey?: string,
  gitref = "main"
) => {
  for (const manifestsHost of manifestsHosts) {
    const manifestUrl = `https://${manifestsHost}/redstone-finance/redstone-monorepo-priv/${gitref}/packages/chain-configs/manifest/chain-configs.json`;
    try {
      const response = await RedstoneCommon.axiosGetWithRetries<
        Manifest<ChainConfigs>
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

const fetchChainConfigs = RedstoneCommon.memoize({
  functionToMemoize: fetchChainConfigsWithAxios,
  ttl: 60 * 1000,
});

export async function getChainConfigs(): Promise<ChainConfigs> {
  const manifestsHosts = RedstoneCommon.getFromEnv(
    "MONITORING_MANIFESTS_HOSTNAMES",
    z.array(z.string()).optional()
  );
  const manifestsApiKey = RedstoneCommon.getFromEnv(
    "MONITORING_MANIFESTS_APIKEY",
    z.string().optional()
  );
  const manifestsGitRef = RedstoneCommon.getFromEnv(
    "MONITORING_MANIFESTS_GITREF",
    z.string().default("main")
  );
  let chainConfigsManifest: Manifest;
  if (manifestsHosts?.length) {
    chainConfigsManifest = await fetchChainConfigs(
      manifestsHosts,
      manifestsApiKey,
      manifestsGitRef
    );
  } else {
    chainConfigsManifest = localChainConfigsManifest;
  }
  const resolvedManifest = resolveManifest(chainConfigsManifest);

  return ChainConfigsSchema.parse(resolvedManifest);
}

export function getLocalChainConfigs(): ChainConfigs {
  const resolvedManifest = resolveManifest(localChainConfigsManifest);

  return ChainConfigsSchema.parse(resolvedManifest);
}
