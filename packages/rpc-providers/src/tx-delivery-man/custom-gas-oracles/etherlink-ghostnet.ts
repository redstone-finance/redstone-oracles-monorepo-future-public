import axios from "axios";
import { GasOracleFn } from "../TxDelivery";
import { RedstoneCommon } from "@redstone-finance/utils";

const ONE_GWEI = 1e9;

const getEtherlinkGhostnetStats = RedstoneCommon.memoize({
  functionToMemoize: () =>
    axios.get<{
      gas_prices: { fast: number | undefined } | undefined;
    }>(`https://testnet-explorer.etherlink.com/api/v2/stats`),
  ttl: 5_100,
});

export const etherlinkGhostnetGasOracle: GasOracleFn = async () => {
  const { data } = await getEtherlinkGhostnetStats();
  const { gas_prices } = data;

  if (!gas_prices || !gas_prices.fast) {
    throw new Error("Failed to fetch price from oracle");
  }

  return {
    gasPrice: Math.round(gas_prices.fast * ONE_GWEI),
  };
};
