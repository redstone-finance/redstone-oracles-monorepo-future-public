import { Provider } from "@ethersproject/providers";
import {
  EvmMulticallTypes,
  Multicall3Abi,
  RedstoneMulticall3Abi,
} from "@redstone-finance/evm-multicall";
import { RedstoneCommon } from "@redstone-finance/utils";
import { Contract, Wallet } from "ethers";
import { ChainConfig, ChainConfigs } from "./schemes";

export function getChainConfig(
  chainConfigs: ChainConfigs,
  networkName: string
): ChainConfig {
  return RedstoneCommon.assertThenReturn(
    chainConfigs[networkName],
    `Couldn't find chain config for ${networkName}`
  );
}

export function getChainConfigUnsafe(
  chainConfigs: ChainConfigs,
  networkName: string
): ChainConfig | undefined {
  return chainConfigs[networkName];
}

export function getNetworkName(
  chainConfigs: ChainConfigs,
  chainId: number | string
): string {
  const networkName = Object.entries(chainConfigs).find(
    ([_, v]) => v.chainId === Number(chainId)
  )?.[0];
  RedstoneCommon.assert(
    networkName,
    `Couldn't find network for chain_id=${chainId}`
  );
  return networkName;
}

export function getChainConfigByChainId(
  chainConfigs: ChainConfigs,
  chainId: number
) {
  return RedstoneCommon.assertThenReturn(
    Object.values(chainConfigs).find((c) => c.chainId === chainId),
    `Failed to getChainConfigByChainId chainConfig not defined for ${chainId}`
  );
}

export type Multicall3Options = {
  chainId: number;
  overrideAddress?: string;
  signerOrProvider: Wallet | Provider;
};

export function getMulticall3(
  opts: Multicall3Options,
  chainConfig: ChainConfig
): EvmMulticallTypes.Multicall3 | EvmMulticallTypes.RedstoneMulticall3 {
  const { multicall3 } = chainConfig;

  const address = opts.overrideAddress ?? multicall3.address;

  if (multicall3.type === "Multicall3") {
    return new Contract(
      address,
      Multicall3Abi,
      opts.signerOrProvider
    ) as EvmMulticallTypes.Multicall3;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (multicall3.type === "RedstoneMulticall3") {
    return new Contract(
      address,
      RedstoneMulticall3Abi,
      opts.signerOrProvider
    ) as EvmMulticallTypes.RedstoneMulticall3;
  } else {
    throw new Error(`Uknown multicall3.type=${String(multicall3)}`);
  }
}
