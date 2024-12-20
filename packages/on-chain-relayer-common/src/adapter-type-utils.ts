import { z } from "zod";
import {
  AdapterType,
  AnyOnChainRelayerManifest,
  MultiFeedAdapterTypesEnum,
  MultiFeedOnChainRelayerManifest,
  NonEvmAdapterTypesEnum,
} from "./schemas";

export function isMultiFeedRelayerManifest(
  manifest: AnyOnChainRelayerManifest
): manifest is MultiFeedOnChainRelayerManifest {
  return isMultiFeedAdapterType(manifest.adapterContractType);
}

export function isMultiFeedAdapterType(
  adapterContractType: AdapterType
): adapterContractType is z.infer<typeof MultiFeedAdapterTypesEnum> {
  return MultiFeedAdapterTypesEnum.safeParse(adapterContractType).success;
}

export function isNonEvmAdapterType(
  adapterContractType: AdapterType
): adapterContractType is z.infer<typeof NonEvmAdapterTypesEnum> {
  return NonEvmAdapterTypesEnum.safeParse(adapterContractType).success;
}
