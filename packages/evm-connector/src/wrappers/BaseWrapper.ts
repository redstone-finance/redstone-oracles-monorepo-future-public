import { FunctionFragment } from "@ethersproject/abi";
import { RedstonePayload, SignedDataPackage } from "@redstone-finance/protocol";
import { Contract, Signer } from "ethers";
import { addContractWait } from "../helpers/add-contract-wait";

interface OverwriteFunctionArgs<T extends Contract> {
  wrappedContract: T;
  contract: T;
  functionName: string;
}

export abstract class BaseWrapper<T extends Contract> {
  protected contract!: T;

  protected explicitMetadataTimestamp?: number;

  abstract getDataPackagesForPayload(): Promise<SignedDataPackage[]>;

  abstract getUnsignedMetadata(): string;

  async getBytesDataForAppending(): Promise<string> {
    const shouldBeMultipleOf32 = false;
    return await this.prepareRedstonePayload(shouldBeMultipleOf32);
  }

  // RedStone payload can be passed as the last argument of the contract function
  // But it needs to have a length that is a multiplicity of 32, otherwise zeros
  // will be padded right and contract will revert with `CalldataMustHaveValidPayload`
  async getRedstonePayloadForManualUsage(contract: T): Promise<string> {
    this.setContractForFetchingDefaultParams(contract);
    const shouldBeMultipleOf32 = true;
    const payloadWithoutZeroExPrefix =
      await this.prepareRedstonePayload(shouldBeMultipleOf32);
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

    return RedstonePayload.prepare(signedDataPackages, unsignedMetadata);
  }

  setContractForFetchingDefaultParams(contract: T) {
    this.contract = contract;
  }

  overwriteEthersContract(contract: T): T {
    this.setContractForFetchingDefaultParams(contract);
    const contractPrototype = Object.getPrototypeOf(contract) as object;
    const wrappedContract = Object.assign(
      Object.create(contractPrototype) as T,
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
  }: OverwriteFunctionArgs<T>) {
    wrappedContract.populateTransaction[functionName] = async (
      ...args: unknown[]
    ) => {
      const originalTx = await contract.populateTransaction[functionName](
        ...args
      );
      const dataToAppend = await this.getBytesDataForAppending();
      originalTx.data += dataToAppend;
      return originalTx;
    };
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  private overwriteFunction({
    wrappedContract,
    contract,
    functionName,
  }: OverwriteFunctionArgs<T>) {
    const functionFragment = contract.interface.getFunction(functionName);
    const isCall = functionFragment.constant;
    const isDryRun = functionName.endsWith("DryRun");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (wrappedContract as any)[functionName] = async (...args: unknown[]) => {
      // this is copied from node_modules/@ethersproject/contracts/src.ts/index.ts
      const blockTag = BaseWrapper.handleContractOverrides(
        args,
        functionFragment
      );

      const tx = await wrappedContract.populateTransaction[functionName](
        ...args
      );

      if (isCall || isDryRun) {
        const shouldUseSigner = Signer.isSigner(contract.signer);

        const result = await contract[
          shouldUseSigner ? "signer" : "provider"
        ].call(tx, blockTag);

        const decoded = contract.interface.decodeFunctionResult(
          functionName,
          result
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return decoded.length == 1 ? decoded[0] : decoded;
      } else {
        const sentTx = await contract.signer.sendTransaction(tx);

        // Tweak the tx.wait so the receipt has extra properties
        addContractWait(contract, sentTx);

        return sentTx;
      }
    };
  }

  /** Removes contractOverrides. Returns blockTag if passed in contract overrides */
  private static handleContractOverrides(
    args: unknown[],
    functionFragment: FunctionFragment
  ) {
    let blockTag: number | undefined = undefined;
    if (
      args.length === functionFragment.inputs.length + 1 &&
      typeof args[args.length - 1] === "object"
    ) {
      const overrides = { ...(args.pop() as { blockTag?: number }) };
      blockTag = overrides.blockTag;
      delete overrides.blockTag;
      args.push(overrides);
    }
    return blockTag;
  }

  setMetadataTimestamp(timestamp: number) {
    this.explicitMetadataTimestamp = timestamp;
  }

  getMetadataTimestamp(): number {
    return this.explicitMetadataTimestamp ?? Date.now();
  }
}
