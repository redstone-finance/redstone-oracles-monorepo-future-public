import { GasOracleFn } from "../TxDelivery";

const ONE_MICRO_KAVA = 1e12;

export const kavaGasOracle: GasOracleFn = () =>
  Promise.resolve({
    gasPrice: 0.26 * ONE_MICRO_KAVA,
  });
