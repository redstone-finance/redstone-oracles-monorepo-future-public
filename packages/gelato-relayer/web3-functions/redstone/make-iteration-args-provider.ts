import { OnChainRelayerEnv } from "@redstone-finance/on-chain-relayer";
import { AnyOnChainRelayerManifestSchema } from "@redstone-finance/on-chain-relayer-common";
import axios from "axios";
import { IterationArgsProviderEnv } from "../IterationArgsProviderInterface";

const NOT_NEEDED_FOR_GELATO = "Not needed for Gelato";
const NUMBER_NOT_NEEDED_FOR_GELATO = 0;

const EMPTY_GELATO_ENV: OnChainRelayerEnv = {
  relayerIterationInterval: NUMBER_NOT_NEEDED_FOR_GELATO,
  rpcUrls: [NOT_NEEDED_FOR_GELATO],
  privateKey: NOT_NEEDED_FOR_GELATO,
  gasLimit: NUMBER_NOT_NEEDED_FOR_GELATO,
  healthcheckPingUrl: undefined,
  expectedTxDeliveryTimeInMS: NUMBER_NOT_NEEDED_FOR_GELATO,
  singleProviderOperationTimeout: NUMBER_NOT_NEEDED_FOR_GELATO,
  allProvidersOperationTimeout: NUMBER_NOT_NEEDED_FOR_GELATO,
  twoDimensionalFees: false,
  gasMultiplier: 1.125,
  isNotLazy: true,
  disableCustomGasOracle: false,
  fallbackSkipDeviationBasedFrequentUpdates: false,
  temporaryUpdatePriceInterval: -1,
  fallbackOffsetInMilliseconds: 120000,
  useMulticallProvider: true,
  oevTotalTimeout: 10000,
  oevResolveAuctionTimeout: 2000,
  oevVerifyGasPriceDisabled: false,
};

export async function fetchManifestAndSetUp(env: IterationArgsProviderEnv) {
  let manifestData: unknown;

  for (const url of env.manifestUrls) {
    try {
      manifestData = (await axios.get(url)).data;
      if (manifestData) {
        break;
      }
    } catch (e) {
      console.warn(`Error fetching manifest from url: ${url}`);
    }
  }
  if (!manifestData) {
    throw new Error("failed to fetch manifest from all URLs");
  }

  const manifest = AnyOnChainRelayerManifestSchema.parse(manifestData);

  const relayerEnv: OnChainRelayerEnv = {
    ...EMPTY_GELATO_ENV,
    ...env,
  };

  return { relayerEnv, manifest };
}
