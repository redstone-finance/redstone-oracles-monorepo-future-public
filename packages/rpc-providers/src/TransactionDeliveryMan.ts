import { ErrorCode } from "@ethersproject/logger";
import { TransactionResponse } from "@ethersproject/providers";
import { RedstoneCommon } from "@redstone-finance/utils";
import { BigNumber, Contract, providers } from "ethers";
import {
  AuctionModelFee,
  AuctionModelGasEstimator,
} from "./AuctionModelGasEstimator";
import { CHAIN_ID_TO_GAS_ORACLE } from "./CustomGasOracles";
import { Eip1559Fee, Eip1559GasEstimator } from "./Eip1559GasEstimator";
import { GasEstimator } from "./GasEstimator";
import { MultiNodeTxBroadcaster, TxBroadcaster } from "./TxBrodcaster";
import { EthersError, isEthersError, sleepMS } from "./common";

export type FeeStructure = Eip1559Fee | AuctionModelFee;

export type ContractOverrides = {
  nonce: number;
} & FeeStructure;

type LastDeliveryAttempt = {
  nonce: number;
  result?: TransactionResponse;
};

export type GasOracleFn = (
  opts: TransactionDeliveryManOpts,
  attempt: number
) => Promise<FeeStructure>;

export type TransactionDeliveryManOpts = {
  /**
   * It depends on network block finalization
   * For example for ETH ~12 s block times  we should set it to 14_000
   */
  expectedDeliveryTimeMs: number;

  /**
   * Gas limit used by contract
   */
  gasLimit: number;

  /**
   * If network support arbitrum like 2D fees should be set to true
   * more info: https://medium.com/offchainlabs/understanding-arbitrum-2-dimensional-fees-fd1d582596c9
   */
  isArbitrum?: boolean;

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
   * If we want to take rewards from last block we can achieve is using percentiles
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

export const DEFAULT_TRANSACTION_DELIVERY_MAN_PTS = {
  isAuctionModel: false,
  maxAttempts: 10,
  multiplier: 1.125, // 112,5% => 1.125 ** 10 => 3.24 max scaler
  gasLimitMultiplier: 1.5,
  percentileOfPriorityFee: 75,
  isArbitrum: false,
  gasOracleTimeout: 5_000,
  forceDisableCustomGasOracle: false,
  logger: (text: string) => console.log(`[TransactionDeliveryMan] ${text}`),
};

export class TransactionDeliveryMan {
  private readonly opts: Required<TransactionDeliveryManOpts>;
  private readonly estimator: GasEstimator<FeeStructure>;

  constructor(opts: TransactionDeliveryManOpts) {
    this.opts = { ...DEFAULT_TRANSACTION_DELIVERY_MAN_PTS, ...opts };
    this.estimator = this.opts.isAuctionModel
      ? new AuctionModelGasEstimator(this.opts)
      : new Eip1559GasEstimator(this.opts);
  }

  public async deliver<T extends Contract, M extends keyof T>(
    contract: T,
    method: M,
    params: Parameters<T[M]>
  ): Promise<TransactionResponse> {
    const provider = contract.provider as providers.JsonRpcProvider;
    const txBroadcaster = new MultiNodeTxBroadcaster(contract);

    let lastAttempt: LastDeliveryAttempt | undefined = undefined;

    const { contractOverrides, transactionRequest } =
      await this.prepareTransactionRequest(
        contract,
        method,
        params,
        txBroadcaster
      );

    for (let i = 0; i < this.opts.maxAttempts; i++) {
      const attempt = i + 1;
      try {
        lastAttempt = {
          ...(lastAttempt ?? {}),
          ...contractOverrides,
        };
        const signedTx = await contract.signer.signTransaction({
          ...transactionRequest,
          ...contractOverrides,
        });

        lastAttempt.result = await txBroadcaster.broadcast(signedTx);
        this.opts.logger(`Transaction broadcasted successfully`);
      } catch (e) {
        const ethersError = getEthersLikeErrorOrFail(e);

        if (TransactionDeliveryMan.isNonceExpiredError(ethersError)) {
          // if not by us, then it was delivered by someone else
          if (!lastAttempt?.result) {
            throw new Error(
              `Transaction with same nonce ${lastAttempt?.nonce} was delivered by someone else`
            );
          } else {
            // it means that in meantime between check if transaction is delivered and sending new transaction
            // previous transaction was already delivered by (maybe) us
            this.opts.logger(
              `Transaction ${lastAttempt.result.hash} mined nonce changed: ${
                lastAttempt.nonce
              } => ${lastAttempt.nonce + 1}`
            );
            return lastAttempt.result;
          }
          // if underpriced then bump fee and skip sleeping
        } else if (TransactionDeliveryMan.isUnderpricedError(ethersError)) {
          await this.assignNewFees(contractOverrides, provider, attempt);
          continue;
        }

        this.opts.logger(
          `Unknown ethers error occurred (continuing) error :${RedstoneCommon.stringifyError(
            e
          )}`
        );
      }

      this.opts.logger(
        `Waiting ${this.opts.expectedDeliveryTimeMs} [MS] for mining transaction`
      );
      await sleepMS(this.opts.expectedDeliveryTimeMs);

      const currentNonce = await txBroadcaster.fetchNonce();
      if (
        TransactionDeliveryMan.isTransactionDelivered(lastAttempt, currentNonce)
      ) {
        // transaction was already delivered because nonce increased
        if (!lastAttempt.result) {
          throw new Error(
            `Transaction with same nonce ${lastAttempt.nonce} was delivered by someone else`
          );
        }
        this.opts.logger(
          `Transaction ${lastAttempt.result.hash} mined nonce changed: ${lastAttempt.nonce} => ${currentNonce}`
        );

        return lastAttempt.result;
      } else {
        this.opts.logger(
          `Transaction was not delived yet account_nonce=${currentNonce}. Trying with new fees ..`
        );
        await this.assignNewFees(contractOverrides, provider, attempt);
      }
    }

    throw new Error(
      `Failed to deliver transaction after ${this.opts.maxAttempts} attempts`
    );
  }

  private async assignNewFees(
    contractOverrides: ContractOverrides,
    provider: providers.JsonRpcProvider,
    attempt: number
  ) {
    Object.assign(
      contractOverrides,
      this.estimator.scaleFees(await this.getFees(provider, attempt), attempt)
    );
  }

  async prepareTransactionRequest<T extends Contract>(
    contract: T,
    method: string | number | symbol,
    params: unknown[],
    txBroadcaster: TxBroadcaster
  ): Promise<{
    transactionRequest: providers.TransactionRequest;
    contractOverrides: ContractOverrides;
  }> {
    const currentNonce = await txBroadcaster.fetchNonce();
    const fees = await this.getFees(
      contract.provider as providers.JsonRpcProvider,
      0
    );
    const contractOverrides: ContractOverrides = {
      nonce: currentNonce,
      ...fees,
    };
    const populatedTransaction = await contract.populateTransaction[
      method.toString()
    ](...params);

    const transactionRequest = await contract.signer.populateTransaction({
      ...populatedTransaction,
      ...contractOverrides,
      type: Reflect.has(contractOverrides, "gasPrice") ? 0 : 2,
    });

    return { transactionRequest, contractOverrides };
  }

  // RPC errors sucks most of the time, thus we can not rely on them
  private static isUnderpricedError(e: EthersError | AggregateError) {
    const isErrorMatchingPredicate = (e: EthersError) =>
      (e.message.includes("maxFeePerGas") ||
        e.message.includes("baseFeePerGas") ||
        e.code === ErrorCode.INSUFFICIENT_FUNDS ||
        e.code === ErrorCode.REPLACEMENT_UNDERPRICED ||
        e.code === ErrorCode.UNPREDICTABLE_GAS_LIMIT) &&
      !e.message.includes("VM Exception while processing transaction");

    if (e instanceof AggregateError) {
      return e.errors.some(
        (err: unknown) => isEthersError(err) && isErrorMatchingPredicate(err)
      );
    }

    return isErrorMatchingPredicate(e);
  }

  private static isNonceExpiredError(e: EthersError | AggregateError) {
    const isErrorMatchingPredicate = (e: EthersError) =>
      e.message.includes("nonce has already been used") ||
      e.message.includes("invalid nonce") ||
      e.message.includes("invalid sequence") ||
      e.code === ErrorCode.NONCE_EXPIRED;

    if (e instanceof AggregateError) {
      return e.errors.some(
        (err: unknown) => isEthersError(err) && isErrorMatchingPredicate(err)
      );
    }

    return isErrorMatchingPredicate(e);
  }

  private static isTransactionDelivered(
    lastAttempt: LastDeliveryAttempt | undefined,
    currentNonce: number
  ): lastAttempt is LastDeliveryAttempt {
    return lastAttempt ? currentNonce > lastAttempt.nonce : false;
  }

  private async getFees(
    provider: providers.JsonRpcProvider,
    attempt: number
  ): Promise<FeeStructure> {
    try {
      return await this.getFeeFromGasOracle(provider, attempt);
    } catch (e) {
      return await this.estimator.getFees(provider);
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

    this.opts.logger(`getFees result from gasOracle ${JSON.stringify(fee)}`);

    return fee;
  }
}

const getEthersLikeErrorOrFail = (e: unknown): AggregateError | EthersError => {
  const error = e as Partial<EthersError>;

  if (error instanceof AggregateError || (error.code && error.message)) {
    return error as EthersError | AggregateError;
  }

  throw e;
};
