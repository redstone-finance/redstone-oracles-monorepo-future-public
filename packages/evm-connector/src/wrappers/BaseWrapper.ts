import { Contract } from "ethers";
import { addContractWait } from "../helpers/add-contract-wait";

const DEFAULT_GAS_MULTIPLIER = 1.2;
const DEFAULT_GAS_MULTIPLIER_DECIMALS = 8;

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

          // Here we append redstone data to transaction data
          const dataToAppend = await wrapper.getBytesDataForAppending();
          tx.data = tx.data + dataToAppend;

          // We estimate gas limit again, because the attached data
          // has changed the estimated gas cost
          try {
            tx.gasLimit = tx.gasLimit
              ?.mul(
                DEFAULT_GAS_MULTIPLIER * 10 ** DEFAULT_GAS_MULTIPLIER_DECIMALS
              )
              .div(10 ** DEFAULT_GAS_MULTIPLIER_DECIMALS);

            tx.gasLimit = await contract.signer.estimateGas(tx);
          } catch (e: any) {
            throw new Error(
              "Error during gas estimation after appending RedStone payload" +
                e.message
            );
          }

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
