import { expect } from "chai";
import { DEFAULT_TX_DELIVERY_OPTS, TxDeliveryOpts } from "../../src";
import {
  Eip1559Fee,
  Eip1559GasEstimator,
} from "../../src/tx-delivery-man/Eip1559GasEstimator";

describe("Eip1559GasEstimator", () => {
  describe("scaleFees", () => {
    it("should scale according to attempt", () => {
      const opts = {
        ...DEFAULT_TX_DELIVERY_OPTS,
        multiplier: 2,
      } as unknown as Required<TxDeliveryOpts>;
      const scaler = new Eip1559GasEstimator(opts);

      const inputFees: Eip1559Fee = {
        maxFeePerGas: 3,
        maxPriorityFeePerGas: 2,
      };

      expect(scaler.scaleFees(inputFees, 1)).to.deep.equal({
        maxFeePerGas: 6,
        maxPriorityFeePerGas: 4,
      });

      expect(scaler.scaleFees(inputFees, 4)).to.deep.equal({
        maxFeePerGas: 3 * 2 ** 4,
        maxPriorityFeePerGas: 2 * 2 ** 4,
      });

      expect(
        scaler.scaleFees(
          {
            maxFeePerGas: 0,
            maxPriorityFeePerGas: 0,
          },
          4
        )
      ).to.deep.equal({
        maxFeePerGas: 0,
        maxPriorityFeePerGas: 0,
      });
    });

    it("should scale for 2d", () => {
      const opts = {
        ...DEFAULT_TX_DELIVERY_OPTS,
        twoDimensionalFees: true,
        multiplier: 2,
        gasLimitMultiplier: 2,
      } as unknown as Required<TxDeliveryOpts>;
      const scaler = new Eip1559GasEstimator(opts);

      expect(
        scaler.scaleFees(
          {
            maxFeePerGas: 0.1e9,
            maxPriorityFeePerGas: 0,
          },
          1
        )
      ).to.deep.equal({
        maxFeePerGas: 0.2e9,
        maxPriorityFeePerGas: 0,
      });

      expect(
        scaler.scaleFees(
          {
            maxFeePerGas: 0.1e9,
            maxPriorityFeePerGas: 0,
          },
          5
        )
      ).to.deep.equal({
        maxFeePerGas: 0.1e9 * 2 ** 5,
        maxPriorityFeePerGas: 0,
      });
    });
  });
});
