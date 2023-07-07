import { ErrorCode } from "@ethersproject/logger";
import { TransactionResponse } from "@ethersproject/providers";
import { BigNumber, Contract, providers } from "ethers";
import { fetchWithCache, sleepMS } from "./common";

const ONE_GWEI = 1e9;

type ContractOverrides = {
  nonce: number;
} & FeeStructure;

type LastDeliveryAttempt = {
  nonce: number;
  maxFeePerGas: number;
  result?: TransactionResponse;
};

type GasOracleFn = (opts: TransactionDeliveryManOpts) => Promise<FeeStructure>;

type TransactionDeliveryManOpts = {
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
  twoDimensionFees?: boolean;

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

  logger?: (text: string) => void;
};

type FeeStructure = {
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
  gasLimit: number;
};

const unsafeBnToNumber = (bn: BigNumber) => Number(bn.toString());

const getEthFeeFromGasOracle: GasOracleFn = async (
  opts: TransactionDeliveryManOpts
) => {
  const response = // rate limit is 5 seconds
    (
      await fetchWithCache<any>(
        `https://api.etherscan.io/api?module=gastracker&action=gasoracle`,
        6_000
      )
    ).data;

  const { suggestBaseFee, FastGasPrice } = response.result;

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

const CHAIN_ID_TO_GAS_ORACLE = {
  1: getEthFeeFromGasOracle,
} as Record<number, GasOracleFn | undefined>;

const DEFAULT_TRANSACTION_DELIVERY_MAN_PTS = {
  maxAttempts: 10,
  multiplier: 1.125, // 112,5%
  gasLimitMultiplier: 1.5,
  percentileOfPriorityFee: 75,
  twoDimensionFees: false,
  logger: (text: string) =>
    console.log(`[${TransactionDeliveryMan.name}] ${text}`),
};

export class TransactionDeliveryMan {
  private readonly opts: Required<TransactionDeliveryManOpts>;

  constructor(opts: TransactionDeliveryManOpts) {
    this.opts = { ...DEFAULT_TRANSACTION_DELIVERY_MAN_PTS, ...opts };
  }

  public async deliver<T extends Contract, M extends keyof T>(
    contract: T,
    method: M,
    params: Parameters<T[M]>
  ): Promise<TransactionResponse> {
    const provider = contract.provider as providers.JsonRpcProvider;
    const address = await contract.signer.getAddress();

    let lastAttempt: LastDeliveryAttempt | undefined = undefined;

    const currentNonce = await provider.getTransactionCount(address);
    const fees = await this.getFees(provider);
    const contractOverrides: ContractOverrides = {
      nonce: currentNonce,
      ...fees,
    };

    for (let i = 0; i < this.opts.maxAttempts; i++) {
      try {
        lastAttempt = { ...contractOverrides };
        lastAttempt.result = await contract[method](...params, {
          ...contractOverrides,
        });
      } catch (e: any) {
        // if underpriced then bump fee
        this.opts.logger(
          `Failed attempt to call contract code ${e.code} message: ${e.message}`
        );

        if (this.isUnderpricedError(e)) {
          const scaledFees = this.scaleFees(await this.getFees(provider));
          Object.assign(contractOverrides, scaledFees);
          // we don't want to sleep on error, we want to react fast
          continue;
        } else {
          throw e;
        }
      }

      await sleepMS(this.opts.expectedDeliveryTimeMs);

      const currentNonce = await provider.getTransactionCount(address);
      if (this.isTransactionDelivered(lastAttempt, currentNonce)) {
        // transaction was already delivered because nonce increased
        if (!lastAttempt.result) {
          throw new Error(
            "Transaction with sane nonce was delivered by someone else"
          );
        }
        return lastAttempt?.result;
      } else {
        const scaledFees = this.scaleFees(contractOverrides);
        Object.assign(contractOverrides, scaledFees);
      }
    }

    throw new Error(
      `Failed to deliver transaction after ${this.opts.maxAttempts} attempts`
    );
  }

  private isUnderpricedError(e: any) {
    return (
      // RPC errors sucks most of the time, thus we can not rely on them
      // thus this is list is wider then it could be
      e.message.includes("maxFeePerGas") ||
      e.message.includes("baseFeePerGas") ||
      e.code === ErrorCode.INSUFFICIENT_FUNDS ||
      e.code === ErrorCode.SERVER_ERROR ||
      e.code === ErrorCode.UNPREDICTABLE_GAS_LIMIT ||
      e.code === ErrorCode.INSUFFICIENT_FUNDS
    );
  }

  private isTransactionDelivered(
    lastAttempt: LastDeliveryAttempt | undefined,
    currentNonce: number
  ) {
    return lastAttempt && currentNonce > lastAttempt.nonce;
  }

  private async getFees(
    provider: providers.JsonRpcProvider
  ): Promise<FeeStructure> {
    try {
      return await this.getFeeFromGasOracle(provider);
    } catch (e) {
      return await this.getFeeFromProvider(provider);
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

    const fee = await gasOracle(this.opts);

    this.opts.logger(`getFees result from gasOracle ${JSON.stringify(fee)}`);

    return fee;
  }

  /** this is reasonable (ether.js is not reasonable) fallback if gasOracle is not set */
  private async getFeeFromProvider(
    provider: providers.JsonRpcProvider
  ): Promise<FeeStructure> {
    const lastBlock = await provider.getBlock("latest");
    const maxPriorityFeePerGas = await this.estimatePriorityFee(provider);

    const baseFee = Math.round(
      unsafeBnToNumber(lastBlock.baseFeePerGas as BigNumber)
    );
    const maxFeePerGas = baseFee + maxPriorityFeePerGas;

    const fee: FeeStructure = {
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasLimit: this.opts.gasLimit,
    };

    this.opts.logger(`getFees result from provider ${JSON.stringify(fee)}`);

    return fee;
  }

  /**
   * Take value of percentileOfPriorityFee from last 2 blocks.
   * And return maximal value from it.
   */
  private async estimatePriorityFee(
    provider: providers.JsonRpcProvider
  ): Promise<number> {
    const feeHistory = await provider.send("eth_feeHistory", [
      "0x2",
      "pending",
      [this.opts.percentileOfPriorityFee],
    ]);

    const rewardsPerBlockForPercentile = feeHistory.reward
      .flat()
      .map((hex: string) => parseInt(hex, 16));

    return Math.max(...rewardsPerBlockForPercentile);
  }

  private scaleFees(currentFees: FeeStructure): FeeStructure {
    const maxPriorityFeePerGas = Math.round(
      currentFees.maxPriorityFeePerGas * this.opts.multiplier
    );
    const maxFeePerGas = Math.round(
      currentFees.maxFeePerGas * this.opts.multiplier
    );
    const gasLimit = this.opts.twoDimensionFees
      ? Math.round(currentFees.gasLimit * this.opts.gasLimitMultiplier)
      : currentFees.gasLimit;

    const scaledFees: FeeStructure = {
      maxPriorityFeePerGas,
      maxFeePerGas,
      gasLimit,
    };

    this.opts.logger(`Scaling fees to ${JSON.stringify(scaledFees)}`);

    return scaledFees;
  }
}
