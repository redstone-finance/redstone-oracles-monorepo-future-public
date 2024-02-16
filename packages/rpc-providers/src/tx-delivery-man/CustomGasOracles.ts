import {
  GasOracleFn,
  TransactionDeliveryManOpts,
} from "./TransactionDeliveryMan";
import { RedstoneCommon } from "@redstone-finance/utils";
import axios from "axios";

const ONE_GWEI = 1e9;
const ONE_MICRO_KAVA = 1e12;

const getEthGasRequest = RedstoneCommon.memoize({
  functionToMemoize: () =>
    axios.get<{
      result: { suggestBaseFee: number; FastGasPrice: number };
    }>(`https://api.etherscan.io/api?module=gastracker&action=gasoracle`),
  ttl: 5_100,
});

const getEthFeeFromGasOracle: GasOracleFn = async (
  opts: TransactionDeliveryManOpts
) => {
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
    gasLimit: opts.gasLimit,
  };
};

const kavaGasOracle: GasOracleFn = async (
  opts: TransactionDeliveryManOpts
  // eslint-disable-next-line @typescript-eslint/require-await
) => {
  return {
    gasLimit: opts.gasLimit,
    gasPrice: 0.26 * ONE_MICRO_KAVA,
  };
};

export const CHAIN_ID_TO_GAS_ORACLE = {
  1: getEthFeeFromGasOracle,
  2222: kavaGasOracle,
} as Record<number, GasOracleFn | undefined>;
