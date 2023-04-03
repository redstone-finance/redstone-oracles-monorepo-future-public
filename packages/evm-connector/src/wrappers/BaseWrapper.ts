import { Contract, PopulatedTransaction, Signer } from "ethers";
import { addContractWait } from "../helpers/add-contract-wait";

export interface ParamsForDryRunVerification {
  functionName: string;
  contract: Contract;
  transaction: PopulatedTransaction;
}

interface OverwriteFunctionArgs {
  wrappedContract: Contract;
  contract: Contract;
  functionName: string;
}

export abstract class BaseWrapper {
  abstract getBytesDataForAppending(
    params?: ParamsForDryRunVerification
  ): Promise<string>;

  overwriteEthersContract(contract: Contract): Contract {
    const contractPrototype = Object.getPrototypeOf(contract);
    const wrappedContract = Object.assign(
      Object.create(contractPrototype),
      contract,
      { populateTransaction: {} }
    );

    const functionNames: string[] = Object.keys(contract.functions);
    functionNames.forEach((functionName) => {
      if (!functionName.includes("(")) {
        // It's important to overwrite the `populateTransaction`
        // function before overwriting the contract function,
        // because the updated implementation of the contract function
        // expects that the `populateTransaction` will return tx with
        // an attached redstone payload
        this.overwritePopulateTransaction({
          wrappedContract,
          contract,
          functionName,
        });

        this.overwriteFunction({ wrappedContract, contract, functionName });
      }
    });

    return wrappedContract;
  }

  private overwritePopulateTransaction({
    wrappedContract,
    contract,
    functionName,
  }: OverwriteFunctionArgs) {
    wrappedContract.populateTransaction[functionName] = async (
      ...args: any[]
    ) => {
      const originalTx = await contract.populateTransaction[functionName](
        ...args
      );
      const dataToAppend = await this.getBytesDataForAppending({
        functionName,
        contract,
        transaction: originalTx,
      });
      originalTx.data += dataToAppend;
      return originalTx;
    };
  }

  private overwriteFunction({
    wrappedContract,
    contract,
    functionName,
  }: OverwriteFunctionArgs) {
    const isCall = contract.interface.getFunction(functionName).constant;
    const isDryRun = functionName.endsWith("DryRun");

    (wrappedContract[functionName] as any) = async (...args: any[]) => {
      const tx = await wrappedContract.populateTransaction[functionName](
        ...args
      );

      if (isCall || isDryRun) {
        const shouldUseSigner = Signer.isSigner(contract.signer);

        const result = await contract[
          shouldUseSigner ? "signer" : "provider"
        ].call(tx);

        const decoded = contract.interface.decodeFunctionResult(
          functionName,
          result
        );
        return decoded.length == 1 ? decoded[0] : decoded;
      } else {
        const sentTx = await contract.signer.sendTransaction(tx);

        // Tweak the tx.wait so the receipt has extra properties
        addContractWait(contract, sentTx);

        return sentTx;
      }
    };
  }
}
