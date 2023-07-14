import { Contract, Signer } from "ethers";
import { addContractWait } from "../helpers/add-contract-wait";
import { RedstonePayload, SignedDataPackage } from "redstone-protocol";

interface OverwriteFunctionArgs {
  wrappedContract: Contract;
  contract: Contract;
  functionName: string;
}

export abstract class BaseWrapper {
  protected contract!: Contract;

  abstract getDataPackagesForPayload(): Promise<SignedDataPackage[]>;

  abstract getUnsignedMetadata(): string;

  async getBytesDataForAppending(): Promise<string> {
    const shouldBeMultipleOf32 = false;
    return await this.prepareRedstonePayload(shouldBeMultipleOf32);
  }

  // Redstone payload can be passed as the last argument of the contract function
  // But it needs to have a length that is a multiplicity of 32, otherwise zeros
  // will be padded right and contract will revert with `CalldataMustHaveValidPayload`
  async getRedstonePayloadForManualUsage(contract: Contract): Promise<string> {
    this.setContractForFetchingDefaultParams(contract);
    const shouldBeMultipleOf32 = true;
    const payloadWithoutZeroExPrefix = await this.prepareRedstonePayload(shouldBeMultipleOf32);
    return "0x" + payloadWithoutZeroExPrefix;
  }

  async prepareRedstonePayload(shouldBeMultipleOf32: boolean): Promise<string> {
    const signedDataPackages = await this.getDataPackagesForPayload();
    let unsignedMetadata = this.getUnsignedMetadata();

    const originalPayload = RedstonePayload.prepare(
      signedDataPackages,
      unsignedMetadata
    );

    if (!shouldBeMultipleOf32) {
      return originalPayload;
    }

    // Calculating the number of bytes in the hex representation of payload
    // We divide by 2, beacuse 2 symbols in a hex string represent one byte
    const originalPayloadLength = originalPayload.length / 2;

    // Number of bytes that we want to add to unsigned metadata so that
    // payload byte size becomes a multiplicity of 32
    const bytesToAdd = 32 - (originalPayloadLength % 32);

    // Adding underscores to the end of the metadata string, each underscore
    // uses one byte in UTF-8
    unsignedMetadata += "_".repeat(bytesToAdd);

    return RedstonePayload.prepare(
      signedDataPackages,
      unsignedMetadata
    );
  }

  setContractForFetchingDefaultParams(contract: Contract) {
    this.contract = contract;
  }

  overwriteEthersContract(contract: Contract): Contract {
    this.setContractForFetchingDefaultParams(contract);
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
      const dataToAppend = await this.getBytesDataForAppending();
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
