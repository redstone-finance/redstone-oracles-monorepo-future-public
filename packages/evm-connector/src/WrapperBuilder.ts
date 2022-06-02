import { Contract, ethers, Signer, BytesLike } from "ethers";
import {
  DataPackage,
  serializeSignedDataPackageToHexString,
  signDataPackage,
} from "redstone-protocol";
import { deepCopy } from "ethers/lib/utils";
import { TransactionResponse } from "@ethersproject/providers";

// Well-known private key
const MOCK_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export class WrapperBuilder {
  constructor(private baseContract: Contract) {}

  static wrap(contract: Contract): WrapperBuilder {
    return new WrapperBuilder(contract);
  }

  // TODO: implement
  usingDataFeed(dataFeedId: string): Contract {
    return this.baseContract;
  }

  usingDataSources(dataSourcesConfig: any[]): Contract {
    return this.baseContract;
  }

  usingMockData(mockDataPackage: DataPackage) {
    const contract = this.baseContract;
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

          const signedDataPackage = await signDataPackage(
            mockDataPackage,
            MOCK_PRIVATE_KEY
          );

          // Here we append redstone data to transaction data
          tx.data =
            tx.data + serializeSignedDataPackageToHexString(signedDataPackage);

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

// TODO: move this function to another file
// Copied from ethers.js implementation
function addContractWait(contract: Contract, tx: TransactionResponse) {
  const wait = tx.wait.bind(tx);
  tx.wait = (confirmations?: number) => {
    return wait(confirmations).then((receipt: any) => {
      receipt.events = receipt.logs.map((log: any) => {
        let event: any = <Event>deepCopy(log);
        // let parsed: LogDescription = null;
        let parsed: any = null;
        try {
          parsed = contract.interface.parseLog(log);
        } catch (e) {}

        // Successfully parsed the event log; include it
        if (parsed) {
          event.args = parsed.args;
          event.decode = (data: BytesLike, topics?: Array<any>) => {
            return contract.interface.decodeEventLog(
              parsed.eventFragment,
              data,
              topics
            );
          };
          event.event = parsed.name;
          event.eventSignature = parsed.signature;
        }

        // Useful operations
        event.removeListener = () => {
          return contract.provider;
        };
        event.getBlock = () => {
          return contract.provider.getBlock(receipt.blockHash);
        };
        event.getTransaction = () => {
          return contract.provider.getTransaction(receipt.transactionHash);
        };
        event.getTransactionReceipt = () => {
          return Promise.resolve(receipt);
        };

        return event;
      });

      return receipt;
    });
  };
}
