import { RedstoneCommon } from "@redstone-finance/utils";
import axios from "axios";
import { GasOracleFn } from "../TxDelivery";

const ONE_GWEI = 1e9;

const getBlockscoutStats = RedstoneCommon.memoize({
  functionToMemoize: (blockscoutExplorerBaseUrl) =>
    axios.get<{
      gas_prices: { fast: number | undefined } | undefined;
    }>(`${blockscoutExplorerBaseUrl}/api/v2/stats`),
  ttl: 5_100,
});

type BlockscoutStatsGasOracleFn = (apiV2BaseUrl: string) => GasOracleFn;

export const blockscoutStatsGasOracle: BlockscoutStatsGasOracleFn =
  (apiV2BaseUrl: string) => async () => {
    const { data } = await getBlockscoutStats(apiV2BaseUrl);
    const { gas_prices } = data;

    if (!gas_prices || !gas_prices.fast) {
      throw new Error("Failed to fetch price from oracle");
    }

    return {
      gasPrice: Math.round(gas_prices.fast * ONE_GWEI),
    };
  };
