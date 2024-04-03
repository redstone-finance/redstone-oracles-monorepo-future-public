import { RedstoneCommon } from "@redstone-finance/utils";
import axios from "axios";
import { GasOracleFn } from "../TxDelivery";

const ONE_GWEI = 1e9;

const getEthGasRequest = RedstoneCommon.memoize({
  functionToMemoize: () =>
    axios.get<{
      result: { suggestBaseFee: number; FastGasPrice: number };
    }>(`https://api.etherscan.io/api?module=gastracker&action=gasoracle`),
  ttl: 5_100,
});

export const getEthFeeFromGasOracle: GasOracleFn = async () => {
  const { data } = await getEthGasRequest();
  const { suggestBaseFee, FastGasPrice } = data.result;

  if (!suggestBaseFee || !FastGasPrice) {
    throw new Error("Failed to fetch price from oracle");
  }

  return {
    maxFeePerGas: Math.round(FastGasPrice * ONE_GWEI),
    maxPriorityFeePerGas: Math.round(
      (FastGasPrice - suggestBaseFee) * ONE_GWEI
    ),
  };
};
