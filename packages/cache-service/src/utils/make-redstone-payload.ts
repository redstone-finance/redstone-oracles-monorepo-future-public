import { RedstonePayload, SignedDataPackage } from "@redstone-finance/protocol";
import { DataPackagesResponse } from "@redstone-finance/sdk";

export function makePayload(
  cachedDataPackagesResponse: DataPackagesResponse,
  unsignedMetadataMsg?: string
): RedstonePayload {
  const cachedDataPackages = Object.values(
    cachedDataPackagesResponse
  ).flat() as SignedDataPackage[];

  return new RedstonePayload(cachedDataPackages, unsignedMetadataMsg || "");
}
