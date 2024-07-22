import { ErrorCode } from "@ethersproject/logger";
import {
  TransactionRequest,
  TransactionResponse,
} from "@ethersproject/providers";
import { RedstoneCommon, loggerFactory } from "@redstone-finance/utils";
import { BigNumber, PopulatedTransaction, providers, utils } from "ethers";
import _ from "lodash";
import { EthersError, isEthersError } from "../common";
import {
  AuctionModelFee,
  AuctionModelGasEstimator,
} from "./AuctionModelGasEstimator";
import { CHAIN_ID_TO_GAS_ORACLE } from "./CustomGasOracles";
import { Eip1559Fee, Eip1559GasEstimator } from "./Eip1559GasEstimator";
import { GasEstimator } from "./GasEstimator";
import { GasLimitEstimator } from "./GasLimitEstimator";

export type FeeStructure = Eip1559Fee | AuctionModelFee;

export type ContractOverrides = {
  nonce: number;
  gasLimit: number;
} & FeeStructure;

enum TransactionBroadcastErrorResult {
  AlreadyDelivered,
  Underpriced,
  UnknownError,
}

type DeliveryManTx =
  | {
      type: 2;
      maxFeePerGas: number;
      maxPriorityFeePerGas: number;
      nonce: number;
      chainId: number;
      gasLimit: number;
      from: string;
      to: string;
      data: string;
    }
  | {
      type: 0;
      gasPrice: number;
      nonce: number;
      chainId: number;
      gasLimit: number;
      from: string;
      to: string;
      data: string;
    };

export type GasOracleFn = (
  opts: TxDeliveryOptsValidated,
  attempt: number
) => Promise<FeeStructure>;

export type TxDeliveryOpts = {
  /**
   * It depends on network block finalization,
   * For example, for ETH ~12 s block times we should set it to 14_000
   */
  expectedDeliveryTimeMs: number;

  /**
   * Gas limit used by contract
   */
  gasLimit?: number;

  /**
   * If network support arbitrum like 2D fees should be set to true
   * more info: https://medium.com/offchainlabs/understanding-arbitrum-2-dimensional-fees-fd1d582596c9
   */
  twoDimensionalFees?: boolean;

  /**
   * Max number of attempts to deliver transaction
   */
  maxAttempts?: number;

  /**
   * Multiply last failed gas fee by
   */
  multiplier?: number;

  /**
   * Multiply las failed gas limit by
   */
  gasLimitMultiplier?: number;

  /**
   * If we want to take rewards from the last block we can achieve is using percentiles
   * 75 percentile we will receive reward which was given by 75% of users and 25% of them has given bigger reward
   * the bigger the value the higher priority fee
   * If you want to prioritize speed over cost choose number between 50-95
   * If you want to prioritize cost over speed choose numbers between 1-50
   */
  percentileOfPriorityFee?: number;

  /**
   * How many blocks to use in eth_feeHistory
   */
  numberOfBlocksForFeeHistory?: number;

  /**
   * Should be set to true if chain doesn't support EIP1559
   */
  isAuctionModel?: boolean;

  /**
   * Forcefully disable custom gas oracle if defined
   */
  forceDisableCustomGasOracle?: boolean;

  logger?: (text: string) => void;

  gasOracleTimeout?: number;
};

export const unsafeBnToNumber = (bn: BigNumber) => Number(bn.toString());

const logger = loggerFactory("TxDelivery");

export const DEFAULT_TX_DELIVERY_OPTS = {
  isAuctionModel: false,
  maxAttempts: 8,
  multiplier: 1.4, //  1.4 ** 5 => 5.24 max scaler
  gasLimitMultiplier: 1.2,
  percentileOfPriorityFee: 50,
  twoDimensionalFees: false,
  gasOracleTimeout: 5_000,
  forceDisableCustomGasOracle: false,
  numberOfBlocksForFeeHistory: 2,
  logger: logger.log.bind(logger),
};

export type TxDeliveryOptsValidated = Omit<
  Required<TxDeliveryOpts>,
  "gasLimit"
> & {
  gasLimit?: number;
};

/**
 * All values has to resolve to hex values
 */
export type TxDeliveryCall = {
  from: string;
  to: string;
  data: string;
  value?: string;
};

export type TxDeliverySigner = {
  signTransaction: (tx: TransactionRequest) => Promise<string>;
  getAddress: () => Promise<string>;
};

export class TxDelivery {
  private readonly opts: TxDeliveryOptsValidated;
  private readonly feeEstimator: GasEstimator<FeeStructure>;
  private readonly gasLimitEstimator: GasLimitEstimator;
  attempt = 1;

  constructor(
    opts: TxDeliveryOpts,
    private readonly signer: TxDeliverySigner,
    private readonly provider: providers.JsonRpcProvider,
    private readonly deferredCallData?: () => Promise<string>
  ) {
    this.opts = _.merge({ ...DEFAULT_TX_DELIVERY_OPTS }, opts);
    this.feeEstimator = this.opts.isAuctionModel
      ? new AuctionModelGasEstimator(this.opts)
      : new Eip1559GasEstimator(this.opts);
    this.gasLimitEstimator = new GasLimitEstimator(this.opts);
  }

  public async deliver(call: TxDeliveryCall): Promise<TransactionResponse> {
    RedstoneCommon.assert(
      this.attempt === 1,
      "TxDelivery.deliver can be called only once per instance"
    );
    let tx = await this.prepareTransactionRequest(call);
    let result: TransactionResponse | undefined = undefined;

    for (
      this.attempt = 1;
      this.attempt <= this.opts.maxAttempts;
      this.attempt++
    ) {
      try {
        this.logCurrentAttempt(tx);

        result = await this.signAndSendTx(tx);
      } catch (ethersError) {
        const broadcastErrorResult = this.handleTransactionBroadcastError(
          ethersError,
          result,
          tx.nonce
        );

        switch (broadcastErrorResult) {
          case TransactionBroadcastErrorResult.AlreadyDelivered:
            return result!;
          case TransactionBroadcastErrorResult.Underpriced:
            tx = await this.updateTxParamsForNextAttempt(tx);
            // skip sleeping
            continue;
          default:
            this.opts.logger(
              `Failed to delivery transaction with unknown error. Aborting delivery. error=${RedstoneCommon.stringifyError(
                ethersError
              )}`
            );
            throw ethersError;
        }
      }

      await this.waitForTxMining();
      const wasDelivered = await this.isDelivered(tx, result);

      if (wasDelivered) {
        return result;
      } else {
        tx = await this.updateTxParamsForNextAttempt(tx);
      }
    }

    throw new Error(
      `Failed to deliver transaction after ${this.opts.maxAttempts} attempts`
    );
  }

  private logCurrentAttempt(tx: DeliveryManTx) {
    let feesInfo: string;
    if (tx.type == 0) {
      feesInfo = `gasPrice=${tx.gasPrice}`;
    } else {
      feesInfo = `maxFeePerGas=${tx.maxFeePerGas} maxPriorityFeePerGas=${tx.maxPriorityFeePerGas}`;
    }
    this.opts.logger(
      `Trying to delivery transaction attempt=${this.attempt}/${this.opts.maxAttempts} txNonce=${tx.nonce} gasLimit=${tx.gasLimit} ${feesInfo}`
    );
  }

  private async signAndSendTx(tx: DeliveryManTx) {
    const signedTx = await this.signer.signTransaction(tx);
    const result = await this.provider.sendTransaction(signedTx);
    this.opts.logger(`Transaction broadcasted successfully`);
    return result;
  }

  private async isDelivered(
    tx: DeliveryManTx,
    result: TransactionResponse
  ): Promise<boolean> {
    const address = await this.signer.getAddress();
    const currentNonce = await this.provider.getTransactionCount(address);

    if (currentNonce > tx.nonce) {
      // transaction was already delivered because nonce increased
      this.opts.logger(
        `Transaction ${result.hash} mined, nonce changed: ${tx.nonce} => ${currentNonce}`
      );

      return true;
    } else {
      this.opts.logger(
        `Transaction was not delivered yet, account_nonce=${currentNonce}. Trying with new fees ..`
      );
      return false;
    }
  }

  private async waitForTxMining() {
    this.opts.logger(
      `Waiting ${this.opts.expectedDeliveryTimeMs} [MS] for mining transaction`
    );
    await RedstoneCommon.sleep(this.opts.expectedDeliveryTimeMs);
  }

  private handleTransactionBroadcastError(
    ethersError: unknown,
    result: TransactionResponse | undefined,
    nonce: number
  ) {
    RedstoneCommon.assert(
      isEthersError(ethersError),
      "Unknown non ethers error"
    );

    if (TxDelivery.isNonceExpiredError(ethersError)) {
      // if not by us, then it was delivered by someone else
      if (!result) {
        throw new Error(
          `Transaction with same nonce ${nonce} was delivered by someone else`
        );
      } else {
        // it means that in meantime between check if transaction is delivered and sending new transaction
        // previous transaction was already delivered by (maybe) us
        this.opts.logger(
          `Nonce expired error: Transaction hash=${result.hash} nonce=${nonce} mined`
        );
        return TransactionBroadcastErrorResult.AlreadyDelivered;
      }
      // if underpriced then bump fee and skip sleeping
    } else if (TxDelivery.isUnderpricedError(ethersError)) {
      this.opts.logger(
        `Underpriced error occurred, trying with scaled fees without sleep`
      );
      return TransactionBroadcastErrorResult.Underpriced;
    }

    return TransactionBroadcastErrorResult.UnknownError;
  }

  private async updateTxParamsForNextAttempt(
    tx: DeliveryManTx
  ): Promise<DeliveryManTx> {
    const gasEstimateTx = convertToTxDeliveryCall(tx);
    const [newFees, newGasLimit, newCalldata] = await Promise.all([
      this.getFees(),
      this.gasLimitEstimator.getGasLimit(this.provider, gasEstimateTx),
      this.resolveTxDeliveryCallData(gasEstimateTx),
    ]);

    return {
      ...tx,
      ...this.feeEstimator.scaleFees(newFees, this.attempt),
      gasLimit: this.gasLimitEstimator.scaleGasLimit(newGasLimit, this.attempt),
      data: newCalldata,
    };
  }

  async prepareTransactionRequest(
    call: TxDeliveryCall
  ): Promise<DeliveryManTx> {
    const address = await this.signer.getAddress();
    const currentNonce = await this.provider.getTransactionCount(address);

    const fees = await this.getFees();
    const gasLimit = await this.gasLimitEstimator.getGasLimit(
      this.provider,
      convertToTxDeliveryCall(call)
    );

    const { chainId } = await this.provider.getNetwork();

    const transactionRequest = {
      ...call,
      nonce: currentNonce,
      chainId,
      gasLimit,
      ...fees,
      type: Reflect.has(fees, "gasPrice") ? 0 : 2,
      value: call.value ?? utils.parseEther("0").toHexString(),
    };

    return transactionRequest as DeliveryManTx;
  }

  private static isUnderpricedError(e: EthersError) {
    return (
      (e.message.includes("maxFeePerGas") ||
        e.message.includes("baseFeePerGas") ||
        e.code === ErrorCode.INSUFFICIENT_FUNDS ||
        e.code === ErrorCode.REPLACEMENT_UNDERPRICED ||
        e.code === ErrorCode.UNPREDICTABLE_GAS_LIMIT) &&
      !e.message.includes("VM Exception while processing transaction")
    );
  }

  private static isNonceExpiredError(e: EthersError) {
    return (
      e.message.includes("nonce has already been used") ||
      e.message.includes("invalid nonce") ||
      e.message.includes("invalid sequence") ||
      e.code === ErrorCode.NONCE_EXPIRED
    );
  }

  private async getFees(): Promise<FeeStructure> {
    // some gas oracles relies on this fallback mechanism
    try {
      return await this.getFeeFromGasOracle(this.provider);
    } catch (e) {
      return await this.feeEstimator.getFees(this.provider);
    }
  }

  private async getFeeFromGasOracle(
    provider: providers.JsonRpcProvider
  ): Promise<FeeStructure> {
    const { chainId } = await provider.getNetwork();
    const gasOracle = CHAIN_ID_TO_GAS_ORACLE[chainId];
    if (!gasOracle) {
      throw new Error(`Gas oracle is not defined for ${chainId}`);
    }

    if (this.opts.forceDisableCustomGasOracle) {
      throw new Error(`Gas oracle was forcefully disabled`);
    }

    try {
      return await RedstoneCommon.timeout(
        gasOracle(this.opts, this.attempt),
        this.opts.gasOracleTimeout,
        `Custom gas oracle timeout after ${this.opts.gasOracleTimeout}`
      );
    } catch (e) {
      logger.error(
        `Custom gas oracle failed. Will fallback to feeEstimator. error=${RedstoneCommon.stringifyError(e)}`
      );
      throw e;
    }
  }

  async resolveTxDeliveryCallData(tx: TxDeliveryCall): Promise<string> {
    if (this.deferredCallData) {
      return await this.deferredCallData();
    }
    return tx.data;
  }
}

export const convertToTxDeliveryCall = (
  transactionRequest: TransactionRequest | PopulatedTransaction
): TxDeliveryCall => ({
  from: transactionRequest.from as string,
  to: transactionRequest.to as string,
  data: transactionRequest.data as string,
});
