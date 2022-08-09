import { Contract } from "ethers";
import { addContractWait } from "../helpers/add-contract-wait";

export abstract class BaseWrapper {
  abstract getBytesDataForAppending(): Promise<string>;

  overwriteEthersContract(contract: Contract): Contract {
    const wrapper = this;
    const contractPrototype = Object.getPrototypeOf(contract);
    const wrappedContract = Object.assign(
      Object.create(contractPrototype),
      contract
    );

    const functionNames: string[] = Object.keys(contract.functions);
    functionNames.forEach((functionName) => {
      if (functionName.indexOf("(") == -1) {
        const isCall = contract.interface.getFunction(functionName).constant;

        (wrappedContract[functionName] as any) = async function (
          ...args: any[]
        ) {
          const tx = await contract.populateTransaction[functionName](...args);

          // Appending redstone data to the transaction calldata
          const dataToAppend = await wrapper.getBytesDataForAppending();
          tx.data = tx.data + dataToAppend;

          if (isCall) {
            const result = await contract.signer.call(tx);
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
    });

    return wrappedContract;
  }
}
