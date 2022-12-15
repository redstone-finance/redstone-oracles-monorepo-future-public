import { RedstonePayload, SignedDataPackage } from "redstone-protocol";
import { DataPackagesResponse } from "../data-packages/data-packages.controller";

export function makePayload(
  cachedDataPackagesResponse: DataPackagesResponse,
  unsignedMetadataMsg?: string
): RedstonePayload {
  const cachedDataPackages = Object.values(cachedDataPackagesResponse).flat();

  return new RedstonePayload(
    cachedDataPackages.map(SignedDataPackage.fromObj),
    unsignedMetadataMsg || ""
  );
}
