import { Contract, PopulatedTransaction, Signer } from "ethers";
import { addContractWait } from "../helpers/add-contract-wait";
import { RedstonePayload, SignedDataPackage } from "redstone-protocol";

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
  protected contract!: Contract;

  abstract getDataPackagesForPayload(
    params?: ParamsForDryRunVerification
  ): Promise<SignedDataPackage[]>;

  abstract getUnsignedMetadata(): string;

  async getRedstonePayloadForManualUsage(
    params?: ParamsForDryRunVerification
  ): Promise<string> {
    const shouldBePreparedForManualUsage = true;
    const payloadWithoutZeroExPrefix = await this.getBytesDataForAppending(
      params,
      shouldBePreparedForManualUsage
    );
    return "0x" + payloadWithoutZeroExPrefix;
  }

  async getBytesDataForAppending(
    params?: ParamsForDryRunVerification,
    shouldBePreparedForManualUsage = false
  ): Promise<string> {
    const signedDataPackages = await this.getDataPackagesForPayload(params);
    let unsignedMetadata = this.getUnsignedMetadata();

    // Redstone payload can be passed as the last argument of the contract function
    // But it needs to have a length that is a multiplicity of 32, otherwise zeros
    // will be padded right and contract will revert with `CalldataMustHaveValidPayload`
    if (shouldBePreparedForManualUsage) {
      const originalPayload = RedstonePayload.prepare(
        signedDataPackages,
        unsignedMetadata
      );
      // Calculating the number of bytes in the hex representation of payload
      const originalPayloadLength = originalPayload.length / 2;

      // Number of bytes that we want to add to unsigned metadata so that
      // payload byte size becomes a multiplicity of 32
      const bytesToAdd = 32 - (originalPayloadLength % 32);

      // Adding underscores to the end of the metadata string, each underscore
      // uses one byte in UTF-8
      unsignedMetadata += "_".repeat(bytesToAdd);
    }

    return RedstonePayload.prepare(signedDataPackages, unsignedMetadata);
  }

  overwriteEthersContract(contract: Contract): Contract {
    this.contract = contract;
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
