import { Contract, BytesLike } from "ethers";
import { deepCopy } from "ethers/lib/utils";
import { TransactionResponse } from "@ethersproject/providers";

// Copied from ethers.js source code
export const addContractWait = (
  contract: Contract,
  tx: TransactionResponse
) => {
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
};
