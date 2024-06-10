import { AuctionModelFee } from "../AuctionModelGasEstimator";
import { GasOracleFn } from "../TxDelivery";

// This value was obtained from the Ethereum Merlin Explorer.
// We don't have a precise calculation method for it, but empirical evidence
// suggests it works reliably. However, there's a risk it might break in the future.
// If it does break, the consequence will be an additional delivery attempt,
// which incurs minimal cost. This is because, when the oracle fails,
// we fallback to the standard gas estimation, which, for Merlin, was overestimating.
// For reference, eth_gasPrice was returning 0.15 GWEI.
const MERLIN_EMPIRIC_MINIMUM_GAS_PRICE = 0.05 * 1e9;

export const merlinGasOracle: GasOracleFn = (
  _opts,
  attempt: number
): Promise<AuctionModelFee> => {
  if (attempt > 1) {
    throw new Error("Merlin gas oracles works only for attempt=1");
  }

  return Promise.resolve({
    gasPrice: MERLIN_EMPIRIC_MINIMUM_GAS_PRICE,
  });
};
