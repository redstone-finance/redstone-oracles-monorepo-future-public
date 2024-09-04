import { Manifest, resolveManifest } from "@redstone-finance/internal-utils";
import { RedstoneCommon } from "@redstone-finance/utils";
import { z } from "zod";
import localChainConfigsManifest from "../manifest/chain-configs.json";
import { ChainConfigs, ChainConfigsSchema } from "./schemes";

const fetchChainConfigsWithAxios = async (
  manifestsHost: string,
  apikey?: string,
  gitref = "main"
) =>
  (
    await RedstoneCommon.axiosGetWithRetries<Manifest<ChainConfigs>>(
      `https://${manifestsHost}/redstone-finance/redstone-monorepo-priv/${gitref}/packages/chain-configs/manifest/chain-configs.json`,
      { maxRetries: 2, headers: { apikey } }
    )
  ).data;

const fetchChainConfigs = RedstoneCommon.memoize({
  functionToMemoize: fetchChainConfigsWithAxios,
  ttl: 60 * 1000,
});

export async function getChainConfigs(): Promise<ChainConfigs> {
  const manifestsHost = RedstoneCommon.getFromEnv(
    "MONITORING_MANIFESTS_HOSTNAME",
    z.string().optional()
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
  if (manifestsHost) {
    chainConfigsManifest = await fetchChainConfigs(
      manifestsHost,
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
