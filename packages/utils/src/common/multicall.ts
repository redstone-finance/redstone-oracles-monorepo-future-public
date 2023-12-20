import { ContractCallContext, Multicall } from "ethereum-multicall";
import {
  CallContext,
  ContractCallOptions,
  ContractCallResults,
} from "ethereum-multicall/dist/esm/models";
import { Contract, providers } from "ethers";
import { FormatTypes } from "ethers/lib/utils";

let multicallAddress: undefined | string = undefined;
export function overrideMulticallAddress(address: string) {
  multicallAddress = address;
}

// for simple single-contract, single-result per contract method call cases
export type CallParams = { function: string; params: unknown[] };

export async function multiCallOneContract(
  contract: Contract,
  calls: CallParams[],
  blockNumber?: string | number
): Promise<unknown[]> {
  const functionToIndex: Record<string, number> = calls.reduce(
    (prev, current, index) => ({
      ...prev,
      [`${current.function}_${index}`]: index,
    }),
    {}
  );
  const callContexts = calls.map((call, index) => ({
    reference: `${call.function}_${index}`,
    methodName: call.function,
    methodParameters: call.params,
  }));
  const multiCallContext: ContractCallContext = {
    reference: "this",
    contractAddress: contract.address,
    abi: JSON.parse(
      contract.interface.format(FormatTypes.json) as string
    ) as unknown[],
    calls: callContexts,
  };

  const multicall = new Multicall({
    tryAggregate: false,
    ethersProvider: contract.provider,
    multicallCustomContractAddress: multicallAddress!,
  });

  const results = await multicall.call(multiCallContext, {
    blockNumber: blockNumber?.toString(),
  });

  const resultsInOrder: unknown[] = new Array(calls.length);
  for (const result of results.results["this"].callsReturnContext) {
    const index = functionToIndex[result.reference];
    if (result.returnValues.length > 1) {
      throw new Error(
        `ethereum-multicall returned more then one decoded response, which was unexpected. Fix code.`
      );
    }
    resultsInOrder[index] = result.returnValues[0];
  }
  return resultsInOrder;
}

// for generic multi-contract or multi-result per contract method call cases

export class MulticallResult {
  constructor(private multicallResults: ContractCallResults) {}

  getResult<T = unknown>(
    contractLabel: string,
    callLabel: string,
    returnValueIndex: number
  ): T {
    return this.getResults<T>(contractLabel, callLabel)[returnValueIndex];
  }

  getResults<T = unknown>(contractLabel: string, callLabel: string): T[] {
    return this.multicallResults.results[contractLabel].callsReturnContext.find(
      (result) => result.reference === callLabel
    )!.returnValues as T[];
  }

  getCallParam<T = unknown>(
    contractLabel: string,
    callLabel: string,
    paramIndex: number
  ): T {
    return this.getCallParams<T>(contractLabel, callLabel)[paramIndex];
  }

  getCallParams<T = unknown>(contractLabel: string, callLabel: string): T[] {
    return this.multicallResults.results[contractLabel].callsReturnContext.find(
      (result) => result.reference === callLabel
    )!.methodParameters as T[];
  }
}

export const prepareContractCall = (
  reference: string,
  contractAddress: string,
  abi: unknown[],
  calls: CallContext[]
): ContractCallContext => {
  return {
    reference,
    contractAddress,
    abi,
    calls,
  };
};

export const prepareCall = (
  reference: string,
  methodName: string,
  methodParameters: unknown[] = []
): CallContext => {
  return {
    reference,
    methodName,
    methodParameters,
  };
};

export const callMulticall = async (
  provider: providers.Provider,
  contractCallContexts: ContractCallContext[] | ContractCallContext,
  contractCallOptions?: ContractCallOptions
) => {
  const result = await new Multicall({
    tryAggregate: false,
    ethersProvider: provider,
    multicallCustomContractAddress: multicallAddress!,
  }).call(contractCallContexts, contractCallOptions);
  return new MulticallResult(result);
};
