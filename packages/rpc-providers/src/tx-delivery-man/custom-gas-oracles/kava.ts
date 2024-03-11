import {
  GasOracleFn,
  TransactionDeliveryManOpts,
} from "../TransactionDeliveryMan";

const ONE_MICRO_KAVA = 1e12;

export const kavaGasOracle: GasOracleFn = async (
  opts: TransactionDeliveryManOpts
  // eslint-disable-next-line @typescript-eslint/require-await
) => {
  return {
    gasLimit: opts.gasLimit,
    gasPrice: 0.26 * ONE_MICRO_KAVA,
  };
};
