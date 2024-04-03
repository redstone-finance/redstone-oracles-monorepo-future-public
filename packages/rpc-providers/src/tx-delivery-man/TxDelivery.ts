import { ErrorCode } from "@ethersproject/logger";
import {
  TransactionRequest,
  TransactionResponse,
} from "@ethersproject/providers";
import { RedstoneCommon } from "@redstone-finance/utils";
import { BigNumber, PopulatedTransaction, providers } from "ethers";
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
   * If you want to prioritize speed over cost choose number between 75-95
   * If you want to prioritize cost over speed choose numbers between 1-50
   */
  percentileOfPriorityFee?: number;

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

export const DEFAULT_TX_DELIVERY_OPTS = {
  isAuctionModel: false,
  maxAttempts: 10,
  multiplier: 1.125, // 112,5% => 1.125 ** 10 => 3.24 max scaler
  gasLimitMultiplier: 1.1,
  percentileOfPriorityFee: 75,
  twoDimensionalFees: false,
  gasOracleTimeout: 5_000,
  forceDisableCustomGasOracle: false,
  logger: (text: string) => console.log(`[TxDelivery] ${text}`),
};

export type TxDeliveryOptsValidated = Omit<
  Required<TxDeliveryOpts>,
  "gasLimit"
> & {
  gasLimit?: number;
};

export type TxDeliveryCall = {
  from: string;
  to: string;
  data: string;
};

export type TxDeliverySigner = {
  signTransaction: (tx: TransactionRequest) => Promise<string>;
  getAddress: () => Promise<string>;
};

export class TxDelivery {
  private readonly opts: TxDeliveryOptsValidated;
  private readonly feeEstimator: GasEstimator<FeeStructure>;
  private readonly gasLimitEstimator: GasLimitEstimator;
  private shouldAbort = false;

  constructor(
    opts: TxDeliveryOpts,
    private readonly signer: TxDeliverySigner,
    private readonly provider: providers.JsonRpcProvider
  ) {
    this.opts = { ...DEFAULT_TX_DELIVERY_OPTS, ...opts };
    this.feeEstimator = this.opts.isAuctionModel
      ? new AuctionModelGasEstimator(this.opts)
      : new Eip1559GasEstimator(this.opts);
    this.gasLimitEstimator = new GasLimitEstimator(this.opts);
  }

  public async deliver(call: TxDeliveryCall): Promise<TransactionResponse> {
    const tx = await this.prepareTransactionRequest(call);

    const txNonce = tx.nonce;

    let result: TransactionResponse | undefined = undefined;

    for (let i = 0; i < this.opts.maxAttempts; i++) {
      const attempt = i + 1;
      try {
        this.logCurrentAttempt(attempt, txNonce, tx);
        result = await this.signAndSendTx(tx);
      } catch (ethersError) {
        const broadcastErrorResult = this.handleTransactionBroadcastError(
          ethersError,
          result,
          txNonce
        );

        switch (broadcastErrorResult) {
          case TransactionBroadcastErrorResult.AlreadyDelivered:
            return result!;
          case TransactionBroadcastErrorResult.Underpriced:
            await this.assignNewFees(tx, attempt);
            // skip sleeping
            continue;
          default:
            throw ethersError;
        }
      }

      await this.waitForTxMining();

      const wasDelivered = await this.handleAttempt(tx, result, attempt);

      if (wasDelivered) {
        return result;
      }
    }

    throw new Error(
      `Failed to deliver transaction after ${this.opts.maxAttempts} attempts`
    );
  }

  private logCurrentAttempt(
    attempt: number,
    txNonce: number,
    tx: DeliveryManTx
  ) {
    let feesInfo: string;
    if (tx.type == 0) {
      feesInfo = `gasPrice=${tx.gasPrice}`;
    } else {
      feesInfo = `maxFeePerGas=${tx.maxFeePerGas} maxPriorityFeePerGas=${tx.maxPriorityFeePerGas}`;
    }
    this.opts.logger(
      `Trying to delivery transaction attempt=${attempt}/${this.opts.maxAttempts} nonce=${txNonce} gasLimit=${tx.gasLimit} ${feesInfo}`
    );
  }

  private async signAndSendTx(tx: DeliveryManTx) {
    const signedTx = await this.signer.signTransaction(tx);
    const result = await this.provider.sendTransaction(signedTx);
    this.opts.logger(`Transaction broadcasted successfully`);
    return result;
  }

  private async handleAttempt(
    tx: DeliveryManTx,
    result: TransactionResponse | undefined,
    attempt: number
  ): Promise<boolean> {
    const address = await this.signer.getAddress();
    const currentNonce = await this.provider.getTransactionCount(address);
    if (currentNonce > tx.nonce) {
      // transaction was already delivered because nonce increased
      if (!result) {
        throw new Error(
          `Transaction with same nonce ${tx.nonce} was delivered by someone else`
        );
      }
      this.opts.logger(
        `Transaction ${result.hash} mined, nonce changed: ${tx.nonce} => ${currentNonce}`
      );

      return true;
    } else {
      this.opts.logger(
        `Transaction was not delivered yet, account_nonce=${currentNonce}. Trying with new fees ..`
      );
      await this.assignNewFees(tx, attempt);
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
          `Transaction hash=${result.hash} nonce=${nonce} mined`
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

  private async assignNewFees(tx: TransactionRequest, attempt: number) {
    Object.assign(
      tx,
      this.feeEstimator.scaleFees(await this.getFees(attempt), attempt)
    );
    tx.gasLimit = this.gasLimitEstimator.scaleGasLimit(
      await this.gasLimitEstimator.getGasLimit(
        this.provider,
        makeTxDeliveryCall(tx)
      ),
      attempt
    );
  }

  async prepareTransactionRequest(
    call: TxDeliveryCall
  ): Promise<DeliveryManTx> {
    const address = await this.signer.getAddress();
    const currentNonce = await this.provider.getTransactionCount(address);

    const fees = await this.getFees(0);
    const gasLimit = await this.gasLimitEstimator.getGasLimit(
      this.provider,
      call
    );

    const { chainId } = await this.provider.getNetwork();

    const transactionRequest = {
      ...call,
      nonce: currentNonce,
      chainId,
      gasLimit,
      ...fees,
      type: Reflect.has(fees, "gasPrice") ? 0 : 2,
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

  private async getFees(attempt: number): Promise<FeeStructure> {
    try {
      return await this.getFeeFromGasOracle(this.provider, attempt);
    } catch (e) {
      return await this.feeEstimator.getFees(this.provider);
    }
  }

  private async getFeeFromGasOracle(
    provider: providers.JsonRpcProvider,
    attempt: number
  ): Promise<FeeStructure> {
    const { chainId } = await provider.getNetwork();
    const gasOracle = CHAIN_ID_TO_GAS_ORACLE[chainId];
    if (!gasOracle) {
      throw new Error(`Gas oracle is not defined for ${chainId}`);
    }

    if (this.opts.forceDisableCustomGasOracle) {
      throw new Error(`Gas oracle was forcefully disabled`);
    }

    const fee = await RedstoneCommon.timeout(
      gasOracle(this.opts, attempt),
      this.opts.gasOracleTimeout,
      `Custom gas oracle timeout after ${this.opts.gasOracleTimeout}`
    );

    return fee;
  }
}

export const makeTxDeliveryCall = (
  transactionRequest: TransactionRequest | PopulatedTransaction
): TxDeliveryCall => ({
  from: transactionRequest.from as string,
  to: transactionRequest.to as string,
  data: transactionRequest.data as string,
});
