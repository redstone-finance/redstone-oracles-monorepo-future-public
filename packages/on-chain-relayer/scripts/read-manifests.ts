import {
  CommonRelayerManifest,
  MultiFeedOnChainRelayerManifest,
  MultiFeedOnChainRelayerManifestSchema,
  OnChainRelayerManifest,
  OnChainRelayerManifestSchema,
} from "@redstone-finance/on-chain-relayer-common";
import * as fs from "fs";
import _ from "lodash";
import * as path from "path";

const removeFileExtension = (fileName: string): string => {
  return path.basename(fileName, path.extname(fileName));
};

export type ManifestType =
  | typeof MANIFEST_TYPE_PRICE_FEEDS
  | typeof MANIFEST_TYPE_MULTI_FEED
  | typeof MANIFEST_TYPE_NON_EVM;

export const MANIFEST_TYPE_PRICE_FEEDS = "price-feeds";
export const MANIFEST_TYPE_MULTI_FEED = "multi-feed";
export const MANIFEST_TYPE_NON_EVM = "non-evm";

const MANIFEST_DIRS: Record<ManifestType, string> = {
  [MANIFEST_TYPE_PRICE_FEEDS]: "../relayer-manifests",
  [MANIFEST_TYPE_MULTI_FEED]: "../relayer-manifests-multi-feed",
  [MANIFEST_TYPE_NON_EVM]: "../relayer-manifests-non-evm",
};

export function readManifests(
  type: typeof MANIFEST_TYPE_PRICE_FEEDS
): Record<string, OnChainRelayerManifest>;
export function readManifests(
  type: typeof MANIFEST_TYPE_MULTI_FEED
): Record<string, MultiFeedOnChainRelayerManifest>;
export function readManifests(
  type: typeof MANIFEST_TYPE_NON_EVM
): Record<string, MultiFeedOnChainRelayerManifest>;
export function readManifests(
  type: ManifestType
): Record<string, OnChainRelayerManifest | MultiFeedOnChainRelayerManifest> {
  const manifests: Record<
    string,
    OnChainRelayerManifest | MultiFeedOnChainRelayerManifest
  > = {};
  const dir = path.resolve(__dirname, MANIFEST_DIRS[type]);
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }

    const data = fs.readFileSync(path.join(dir, file));
    manifests[removeFileExtension(file)] = (
      type === MANIFEST_TYPE_PRICE_FEEDS
        ? OnChainRelayerManifestSchema
        : MultiFeedOnChainRelayerManifestSchema
    ).parse(JSON.parse(data.toString()));
  }

  return manifests;
}

export const readClassicManifests = () => {
  return readManifests(MANIFEST_TYPE_PRICE_FEEDS);
};

export const readMultiFeedManifests = () => {
  return readManifests(MANIFEST_TYPE_MULTI_FEED);
};

export const readNonEvmManifests = () => {
  return readManifests(MANIFEST_TYPE_NON_EVM);
};

export const readAllManifestsAsCommon = () => {
  const manifests: Record<string, CommonRelayerManifest> = _.assign(
    {},
    readClassicManifests(),
    readMultiFeedManifests(),
    readNonEvmManifests()
  );

  return manifests;
};
