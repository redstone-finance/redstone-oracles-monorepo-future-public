import { expect } from "chai";
import {
  DEFAULT_TRANSACTION_DELIVERY_MAN_PTS,
  TransactionDeliveryManOpts,
} from "../src";
import {
  Eip1559Fee,
  Eip1559GasEstimator,
} from "../src/tx-delivery-man/Eip1559GasEstimator";

describe("Eip1559GasEstimator", () => {
  describe("scaleFees", () => {
    it("should scale according to attempt", () => {
      const opts = {
        ...DEFAULT_TRANSACTION_DELIVERY_MAN_PTS,
        multiplier: 2,
      } as unknown as Required<TransactionDeliveryManOpts>;
      const scaler = new Eip1559GasEstimator(opts);

      const inputFees: Eip1559Fee = {
        maxFeePerGas: 3,
        maxPriorityFeePerGas: 2,
        gasLimit: 2,
      };

      expect(scaler.scaleFees(inputFees, 1)).to.deep.equal({
        maxFeePerGas: 6,
        maxPriorityFeePerGas: 4,
        gasLimit: 2,
      });

      expect(scaler.scaleFees(inputFees, 4)).to.deep.equal({
        maxFeePerGas: 3 * 2 ** 4,
        maxPriorityFeePerGas: 2 * 2 ** 4,
        gasLimit: 2,
      });

      expect(
        scaler.scaleFees(
          {
            maxFeePerGas: 0,
            maxPriorityFeePerGas: 0,
            gasLimit: 0,
          },
          4
        )
      ).to.deep.equal({
        maxFeePerGas: 0,
        maxPriorityFeePerGas: 0,
        gasLimit: 0,
      });
    });

    it("should scale for 2d", () => {
      const opts = {
        ...DEFAULT_TRANSACTION_DELIVERY_MAN_PTS,
        isArbitrum: true,
        multiplier: 2,
        gasLimitMultiplier: 2,
      } as unknown as Required<TransactionDeliveryManOpts>;
      const scaler = new Eip1559GasEstimator(opts);

      expect(
        scaler.scaleFees(
          {
            maxFeePerGas: 0.1e9,
            maxPriorityFeePerGas: 0,
            gasLimit: 1e7, // this is max gas limit given standard fee
          },
          1
        )
      ).to.deep.equal({
        maxFeePerGas: 0.2e9,
        maxPriorityFeePerGas: 0,
        gasLimit: 2e7,
      });

      expect(
        scaler.scaleFees(
          {
            maxFeePerGas: 0.1e9,
            maxPriorityFeePerGas: 0,
            gasLimit: 1e7,
          },
          5
        )
      ).to.deep.equal({
        maxFeePerGas: 3.2e9,
        maxPriorityFeePerGas: 0,
        gasLimit: 1e18 / 3.2e9,
      });
    });

    it("simulate arbitrum", () => {
      const opts = {
        ...DEFAULT_TRANSACTION_DELIVERY_MAN_PTS,
        isArbitrum: true,
      } as unknown as Required<TransactionDeliveryManOpts>;
      const scaler = new Eip1559GasEstimator(opts);

      expect(
        scaler.scaleFees(
          {
            // this is typical fee on arbitrum
            maxFeePerGas: 0.1e9,
            maxPriorityFeePerGas: 0,
            gasLimit: 1e9,
          },
          10
        )
      ).to.deep.equal({
        maxPriorityFeePerGas: 0,
        maxFeePerGas: 324732103,
        gasLimit: 3.079461472e9,
      });

      expect(
        scaler.scaleFees(
          {
            // but if gas price is bigger from gas oracle
            maxFeePerGas: 5e9,
            maxPriorityFeePerGas: 0,
            gasLimit: 1e7,
          },
          5
        )
      ).to.deep.equal({
        maxPriorityFeePerGas: 0,
        maxFeePerGas: 9010162354,
        gasLimit: 7.59375e7,
      });
    });
  });
});
