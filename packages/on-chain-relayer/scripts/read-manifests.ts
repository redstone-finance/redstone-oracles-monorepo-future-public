import {
  CommonManifestSchema,
  CommonRelayerManifest,
  MultiFeedOnChainRelayerManifest,
  MultiFeedOnChainRelayerManifestSchema,
  OnChainRelayerManifest,
  OnChainRelayerManifestSchema,
} from "@redstone-finance/on-chain-relayer-common";
import * as fs from "fs";
import * as path from "path";

const removeFileExtension = (fileName: string): string => {
  return path.basename(fileName, path.extname(fileName));
};

export const readClassicManifests = (): Record<
  string,
  OnChainRelayerManifest
> => {
  const manifests: Record<string, OnChainRelayerManifest> = {};
  const dir = path.resolve(__dirname, "../relayer-manifests");
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }
    const data = fs.readFileSync(path.join(dir, file));
    manifests[removeFileExtension(file)] = OnChainRelayerManifestSchema.parse(
      JSON.parse(data.toString())
    );
  }
  return manifests;
};

export const readMultiFeedManifests = (): Record<
  string,
  MultiFeedOnChainRelayerManifest
> => {
  const manifests: Record<string, MultiFeedOnChainRelayerManifest> = {};
  const dir = path.resolve(__dirname, "../relayer-manifests-multi-feed");
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }
    const data = fs.readFileSync(path.join(dir, file));
    manifests[removeFileExtension(file)] =
      MultiFeedOnChainRelayerManifestSchema.parse(JSON.parse(data.toString()));
  }
  return manifests;
};

export const readAllManifestsAsCommon = (): Record<
  string,
  CommonRelayerManifest
> => {
  const allManifests: Record<string, CommonRelayerManifest> = {};

  const classicManifests = readClassicManifests();
  for (const [name, manifest] of Object.entries(classicManifests)) {
    allManifests[name] = CommonManifestSchema.parse(manifest);
  }

  const multiFeedManifests = readMultiFeedManifests();
  for (const [name, manifest] of Object.entries(multiFeedManifests)) {
    allManifests[name] = CommonManifestSchema.parse(manifest);
  }

  return allManifests;
};
