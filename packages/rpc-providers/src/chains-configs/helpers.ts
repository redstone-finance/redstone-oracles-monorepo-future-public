import {
  EvmMulticallTypes,
  Multicall3Abi,
  RedstoneMulticall3Abi,
} from "@redstone-finance/evm-multicall";
import { RedstoneCommon } from "@redstone-finance/utils";
import { Contract, Wallet } from "ethers";

import axios from "axios";
import { ChainConfig, ChainConfigs, SupportedNetworkNames } from "../index";
import { MegaProviderBuilder } from "../MegaProviderBuilder";
import { ProviderWithAgreement } from "../providers/ProviderWithAgreement";

export function getChainConfig(networkName: SupportedNetworkNames) {
  return RedstoneCommon.assertThenReturn(
    ChainConfigs[networkName],
    `Couldn't find chain config for ${networkName}`
  );
}

export function getChainId(networkName: SupportedNetworkNames): number {
  return getChainConfig(networkName).chainId;
}

export function getNetworkName(chainId: number): SupportedNetworkNames {
  const networkName = Object.entries(ChainConfigs).find(
    ([_, v]) => v.chainId === chainId
  )?.[0] as SupportedNetworkNames | undefined;
  RedstoneCommon.assert(
    networkName,
    `Couldn't find network for chain_id=${chainId}`
  );
  return networkName;
}

type ChainConfigsRemote = {
  [chain: string]: {
    chainId: number;
    name: string;
  };
};

export async function getNetworkNameRemote(chainId: number): Promise<string> {
  const chainConfigsUrl =
    "https://d3cu28sut4ahjk.cloudfront.net/redstone-finance/redstone-monorepo-priv/main/packages/rpc-providers/src/chains-configs/chains-configs.json";
  const chainConfigsRemote = (
    await axios.get<ChainConfigsRemote>(chainConfigsUrl)
  ).data;
  const networkName = Object.entries(chainConfigsRemote).find(
    ([_, v]) => v.chainId === chainId
  )?.[0];
  RedstoneCommon.assert(
    networkName,
    `Couldn't find network for chain_id=${chainId}`
  );
  return networkName;
}

export const getChainConfigByChainId = (
  chainId: number,
  remoteChainConfigs?: Record<string, ChainConfig>
) =>
  RedstoneCommon.assertThenReturn(
    Object.values(remoteChainConfigs ?? ChainConfigs).find(
      (c) => c.chainId === chainId
    ),
    `Failed to getChainConfigByChainId chainConfig not defined for ${chainId}`
  );

export function getDefaultProvider(
  networkName: SupportedNetworkNames
): ProviderWithAgreement {
  const chainConfig = ChainConfigs[networkName];
  RedstoneCommon.assert(
    chainConfig,
    `network=${networkName} is not supported by ChainConfigs. Add it or fix typo.`
  );

  return new MegaProviderBuilder({
    rpcUrls: chainConfig.publicRpcUrls,
    network: { name: chainConfig.name, chainId: chainConfig.chainId },
    throttleLimit: 1,
    timeout: 10_000,
  })
    .fallback({})
    .build();
}

type Multicall3Options = {
  networkName?: SupportedNetworkNames;
  chainId?: number;
  remoteChainConfigs?: Record<string, ChainConfig>;
  overrideAddress?: string;
  signerOrProvider?: Wallet;
};

export function getMulticall3(
  options: Multicall3Options
): EvmMulticallTypes.Multicall3 | EvmMulticallTypes.RedstoneMulticall3 {
  if (!options.chainId && !options.networkName) {
    throw new Error("At least one of chainId/networkName needs to be provided");
  }
  const { multicall3 } = options.networkName
    ? ChainConfigs[options.networkName]
    : getChainConfigByChainId(options.chainId!, options.remoteChainConfigs);

  const address = options.overrideAddress ?? multicall3.address;

  if (
    multicall3.type === "Multicall3" ||
    multicall3.type === "zkSyncMulticall3" ||
    multicall3.type === "zkLinkMulticall3"
  ) {
    return new Contract(
      address,
      Multicall3Abi,
      options.signerOrProvider
    ) as EvmMulticallTypes.Multicall3;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (multicall3.type === "RedstoneMulticall3") {
    return new Contract(
      address,
      RedstoneMulticall3Abi,
      options.signerOrProvider
    ) as EvmMulticallTypes.RedstoneMulticall3;
  } else {
    throw new Error(`Uknown multicall3.type=${String(multicall3)}`);
  }
}
