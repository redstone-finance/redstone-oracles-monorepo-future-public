import { ContractCallContext, Multicall } from "ethereum-multicall";
import { Contract } from "ethers";
import { FormatTypes } from "ethers/lib/utils";

let multicallAddress: undefined | string = undefined;
export function overrideMulticallAddress(address: string) {
  multicallAddress = address;
}

export type CallParams = { function: string; params: any[] };

export async function multiCallOneContract(
  contract: Contract,
  calls: CallParams[],
  blockNumber?: string
): Promise<any[]> {
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
    abi: contract.interface.fragments.map((fragment) =>
      fragment.format(FormatTypes.full)
    ),
    calls: callContexts,
  };

  const multicall = new Multicall({
    tryAggregate: true,
    ethersProvider: contract.provider,
    multicallCustomContractAddress: multicallAddress,
  });

  const results = await multicall.call(multiCallContext, { blockNumber });

  const resultsInOrder = new Array(calls.length);
  for (const result of results.results["this"].callsReturnContext) {
    if (!result.success) {
      throw new Error(
        `Failed to execute method of multicall contract: ${contract.address} method name: ${result.methodName}`
      );
    }
    const index = functionToIndex[result.reference!];
    if (result.decoded) {
      if (result.returnValues.length > 1) {
        throw new Error(
          `ethereum-multicall returned more then one decoded response, which was unexpected. Fix code.`
        );
      }
      resultsInOrder[index] = result.returnValues[0];
    } else {
      resultsInOrder[index] = contract.interface.decodeFunctionResult(
        result.methodName,
        result.returnValues
      );
    }
  }
  return resultsInOrder;
}
