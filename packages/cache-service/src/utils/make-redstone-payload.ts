import { RedstonePayload } from "@redstone-finance/protocol";
import { DataPackagesResponse } from "@redstone-finance/sdk";

export function makePayload(
  cachedDataPackagesResponse: DataPackagesResponse,
  unsignedMetadataMsg?: string
): RedstonePayload {
  const cachedDataPackages = Object.values(cachedDataPackagesResponse).flat();

  return new RedstonePayload(cachedDataPackages, unsignedMetadataMsg || "");
}
