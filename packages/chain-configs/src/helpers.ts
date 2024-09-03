import {
  EvmMulticallTypes,
  Multicall3Abi,
  RedstoneMulticall3Abi,
} from "@redstone-finance/evm-multicall";
import { RedstoneCommon } from "@redstone-finance/utils";
import { Contract, Wallet } from "ethers";
import { getChainConfigs, getLocalChainConfigs } from "./get-chain-configs";
import { ChainConfig } from "./schemes";

export async function getChainConfig(
  networkName: string
): Promise<ChainConfig> {
  const chainConfigs = await getChainConfigs();
  return RedstoneCommon.assertThenReturn(
    chainConfigs[networkName],
    `Couldn't find chain config for ${networkName}`
  );
}

export async function getChainConfigUnsafe(
  networkName: string
): Promise<ChainConfig | undefined> {
  const chainConfigs = await getChainConfigs();
  return chainConfigs[networkName];
}

export function getLocalChainConfig(networkName: string): ChainConfig {
  const chainConfigs = getLocalChainConfigs();
  return RedstoneCommon.assertThenReturn(
    chainConfigs[networkName],
    `Couldn't find chain config for ${networkName}`
  );
}

export function getLocalChainConfigUnsafe(
  networkName: string
): ChainConfig | undefined {
  const chainConfigs = getLocalChainConfigs();
  return chainConfigs[networkName];
}

export async function getChainId(networkName: string): Promise<number> {
  return (await getChainConfig(networkName)).chainId;
}

export async function getNetworkName(
  chainId: number | string
): Promise<string> {
  const chainConfigs = await getChainConfigs();
  const networkName = Object.entries(chainConfigs).find(
    ([_, v]) => v.chainId === Number(chainId)
  )?.[0];
  RedstoneCommon.assert(
    networkName,
    `Couldn't find network for chain_id=${chainId}`
  );
  return networkName;
}

export async function getChainConfigByChainId(chainId: number) {
  const chainConfigs = await getChainConfigs();
  return RedstoneCommon.assertThenReturn(
    Object.values(chainConfigs).find((c) => c.chainId === chainId),
    `Failed to getChainConfigByChainId chainConfig not defined for ${chainId}`
  );
}

export function getLocalChainConfigByChainId(chainId: number) {
  const chainConfigs = getLocalChainConfigs();
  return RedstoneCommon.assertThenReturn(
    Object.values(chainConfigs).find((c) => c.chainId === chainId),
    `Failed to getChainConfigByChainId chainConfig not defined for ${chainId}`
  );
}

type Multicall3Options = {
  chainId: number;
  overrideAddress?: string;
  signerOrProvider?: Wallet;
};

export async function getMulticall3(
  opts: Multicall3Options
): Promise<
  EvmMulticallTypes.Multicall3 | EvmMulticallTypes.RedstoneMulticall3
> {
  const { multicall3 } = await getChainConfigByChainId(opts.chainId);

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
