import { GasOracleFn } from "./TxDelivery";
import { getEthFeeFromGasOracle } from "./custom-gas-oracles/ethereum";
import { etherlinkGhostnetGasOracle } from "./custom-gas-oracles/etherlink-ghostnet";
import { kavaGasOracle } from "./custom-gas-oracles/kava";

export const CHAIN_ID_TO_GAS_ORACLE = {
  1: getEthFeeFromGasOracle,
  2222: kavaGasOracle,
  128123: etherlinkGhostnetGasOracle,
} as Record<number, GasOracleFn | undefined>;
