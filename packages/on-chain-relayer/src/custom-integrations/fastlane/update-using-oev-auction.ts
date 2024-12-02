import { JsonRpcProvider } from "@ethersproject/providers";
import {
  Multicall3Request,
  safeExecuteMulticall3,
} from "@redstone-finance/rpc-providers";
import { DataPackagesResponse } from "@redstone-finance/sdk";
import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";
import axios from "axios";
import { BigNumber, providers, Signer, Transaction } from "ethers";
import {
  defaultAbiCoder,
  formatBytes32String,
  parseTransaction,
} from "ethers/lib/utils";
import { RedstoneAdapterBase } from "../../../typechain-types";
import { RelayerConfig } from "../../config/RelayerConfig";
import { RedstoneEvmContract } from "../../facade/EvmContractFacade";

const logger = loggerFactory("update-using-oev-auction");

export const updateUsingOevAuction = async (
  relayerConfig: RelayerConfig,
  txDeliveryCalldata: string,
  blockTag: number,
  adapterContract: RedstoneEvmContract,
  dataPackagesResponse: DataPackagesResponse
) => {
  logger.log(`Updating using OEV auction`);
  const start = Date.now();
  const signedTransactions = await runOevAuction(
    relayerConfig,
    adapterContract.signer,
    txDeliveryCalldata
  );
  logger.log(
    `Received signed oev transactions: ${JSON.stringify(signedTransactions)}`
  );
  await Promise.any(
    signedTransactions.map((tx) =>
      verifyFastlaneResponse(
        adapterContract.provider as providers.JsonRpcProvider,
        tx,
        blockTag,
        adapterContract as RedstoneAdapterBase,
        dataPackagesResponse,
        relayerConfig
      )
    )
  );
  logger.log(`OEV auction successfully completed in ${Date.now() - start}ms`);
};

const runOevAuction = async (
  relayerConfig: RelayerConfig,
  signer: Signer,
  txDeliveryCalldata: string
) => {
  const oevAuctionUrl = relayerConfig.oevAuctionUrl!;
  const { adapterContractAddress, chainId } = relayerConfig;

  const chainIdHex = `0x${chainId.toString(16)}`;
  const body = JSON.stringify({
    adapter: adapterContractAddress,
    updatePayload: txDeliveryCalldata,
    signature: await signer.signMessage(
      `${chainIdHex}:${adapterContractAddress}:${txDeliveryCalldata}`
    ),
    earlyReturn: true,
    chainId: chainIdHex,
  });
  try {
    const response = await axios.post<string[]>(oevAuctionUrl, body, {
      timeout: relayerConfig.oevResolveAuctionTimeout,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      `OEV auction failed: ${RedstoneCommon.stringifyError(error)}`
    );
  }
};

const verifyFastlaneResponse = async (
  provider: JsonRpcProvider,
  tx: string,
  blockTag: number,
  adapterContract: RedstoneAdapterBase,
  dataPackagesResponse: DataPackagesResponse,
  relayerConfig: RelayerConfig
) => {
  const decodedTx = parseTransaction(tx);
  logger.log(`Decoded transaction from FastLane: ${JSON.stringify(decodedTx)}`);
  void tryToPropagateTransaction(provider, tx);
  const checkIfTransactionUpdatesPricePromise = checkIfTransactionUpdatesPrice(
    provider,
    decodedTx,
    blockTag,
    adapterContract,
    dataPackagesResponse,
    relayerConfig
  ).catch((error) => {
    logger.log(
      `Failed to check if transaction updates price: ${RedstoneCommon.stringifyError(error)}`
    );
    throw error;
  });
  const waitForTransactionToMintPromise = waitForTransactionMint(
    provider,
    decodedTx
  ).catch((error) => {
    logger.log(
      `Failed to wait for transaction mint: ${RedstoneCommon.stringifyError(error)}`
    );
    throw error;
  });
  const checkGasPricePromise = verifyGasPrice(
    relayerConfig,
    provider,
    decodedTx
  ).catch((error) => {
    logger.log(
      `Failed to verify gas price: ${RedstoneCommon.stringifyError(error)}`
    );
    throw error;
  });
  await Promise.all([
    checkIfTransactionUpdatesPricePromise,
    waitForTransactionToMintPromise,
    checkGasPricePromise,
  ]);
};

const tryToPropagateTransaction = async (
  provider: providers.JsonRpcProvider,
  tx: string
) => {
  try {
    await provider.sendTransaction(tx);
  } catch (e) {
    logger.log(
      `Unable to propagate, but FastLane likely already did, ${RedstoneCommon.stringifyError(e)}`
    );
  }
};

const waitForTransactionMint = async (
  provider: providers.JsonRpcProvider,
  decodedTx: Transaction
) => {
  logger.log("Waiting for transaction with oev to mint");
  const receipt = await provider.waitForTransaction(decodedTx.hash!);
  if (receipt.status !== 1) {
    throw new Error("Fastlane transaction failed");
  } else {
    logger.log(`OEV transaction: ${decodedTx.hash} minted`);
  }
};

const checkIfTransactionUpdatesPrice = async (
  provider: JsonRpcProvider,
  decodedTx: Transaction,
  blockTag: number,
  adapterContract: RedstoneAdapterBase,
  dataPackagesResponse: DataPackagesResponse,
  relayerConfig: RelayerConfig
) => {
  const priceUpdateRequest: Multicall3Request = {
    target: decodedTx.to!,
    allowFailure: false,
    callData: decodedTx.data,
  };
  const { dataFeeds } = relayerConfig;
  const calldata = adapterContract.interface.encodeFunctionData(
    "getValuesForDataFeeds",
    [dataFeeds.map(formatBytes32String)]
  );

  const priceCheckRequest: Multicall3Request = {
    target: adapterContract.address,
    allowFailure: false,
    callData: calldata,
  };
  const result = await safeExecuteMulticall3(
    provider,
    [priceUpdateRequest, priceCheckRequest],
    false,
    blockTag
  );
  const priceResult = defaultAbiCoder.decode(
    ["uint256[]"],
    result[1].returnData
  );
  const contractDecimals = Math.pow(10, 8);
  const dataFeedIdsWithPricesFromContract = (priceResult[0] as BigNumber[]).map(
    (price, i) => {
      return {
        dataFeedId: dataFeeds[i],
        price: price.toNumber() / contractDecimals,
      };
    }
  );
  for (const dataFeedIdWithPriceFromContract of dataFeedIdsWithPricesFromContract) {
    const dataPackagesFromGateway =
      dataPackagesResponse[dataFeedIdWithPriceFromContract.dataFeedId];
    if (!dataPackagesFromGateway) {
      const errorMessage = `There are no data packages for ${dataFeedIdWithPriceFromContract.dataFeedId}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    const valuesFromGateway = dataPackagesFromGateway.map(
      (dp) =>
        Math.round(Number(dp.toObj().dataPoints[0].value) * contractDecimals) /
        contractDecimals
    );
    const averageValueFromGateway =
      valuesFromGateway.reduce((value1, value2) => value1 + value2, 0) /
      valuesFromGateway.length;
    // minor discrepancies may occur between Solidity and gateway-provided numbers due to precision differences
    if (
      !areAlmostEqual(
        averageValueFromGateway,
        dataFeedIdWithPriceFromContract.price
      )
    ) {
      const errorMessage = `FastLane transaction does not update price for: ${dataFeedIdWithPriceFromContract.dataFeedId}, value from simulation: ${dataFeedIdWithPriceFromContract.price}, value from expected update: ${averageValueFromGateway}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
  logger.log(`FastLane transaction: ${decodedTx.hash} updates price`);
};

const verifyGasPrice = async (
  relayerConfig: RelayerConfig,
  provider: JsonRpcProvider,
  decodedTx: Transaction
): Promise<void> => {
  if (relayerConfig.oevVerifyGasPriceDisabled) {
    return await Promise.resolve();
  } else {
    const gasPrice = await provider.getGasPrice();
    logger.log(
      `Max fee per gas in FastLane transaction: ${decodedTx.maxFeePerGas!.toString()}, current estimated gas price: ${gasPrice.toString()}`
    );
    if (gasPrice.gt(decodedTx.maxFeePerGas!)) {
      throw new Error("FastLane transaction gasPrice too low");
    }
  }
};

const areAlmostEqual = (num1: number, num2: number) => {
  const threshold = 0.00001; // 0.001% difference threshold
  return (
    Math.abs(num1 - num2) <=
    threshold * Math.max(Math.abs(num1), Math.abs(num2))
  );
};
