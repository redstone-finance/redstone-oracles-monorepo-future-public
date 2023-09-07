import { ContractCallContext, Multicall } from "ethereum-multicall";
import { Contract } from "ethers";
import { FormatTypes } from "ethers/lib/utils";

let multicallAddress: undefined | string = undefined;
export function overrideMulticallAddress(address: string) {
  multicallAddress = address;
}

export type CallParams = { function: string; params: unknown[] };

export async function multiCallOneContract(
  contract: Contract,
  calls: CallParams[],
  blockNumber?: string
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
    multicallCustomContractAddress: multicallAddress,
  });

  const results = await multicall.call(multiCallContext, { blockNumber });

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
