import { ParamsForDryRunVerification } from "../wrappers/BaseWrapper";

export interface RequestPayloadWithDryRunParams
  extends ParamsForDryRunVerification {
  redstonePayload: string;
}

export const runDryRun = async ({
  functionName,
  contract,
  transaction,
  redstonePayload,
}: RequestPayloadWithDryRunParams) => {
  const transactionToTest = Object.assign({}, transaction);
  transactionToTest.data = transactionToTest.data + redstonePayload;
  const result = await contract.provider.call(transactionToTest);
  contract.interface.decodeFunctionResult(functionName, result);
};
