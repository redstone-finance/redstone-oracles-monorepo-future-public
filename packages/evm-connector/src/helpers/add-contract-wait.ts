import { Log, TransactionResponse } from "@ethersproject/providers";
import { BytesLike, Contract, ContractReceipt, Event } from "ethers";
import { LogDescription, deepCopy } from "ethers/lib/utils";

// Copied from ethers.js source code
export const addContractWait = (
  contract: Contract,
  tx: TransactionResponse
) => {
  const wait = tx.wait.bind(tx);
  tx.wait = (confirmations?: number) => {
    return wait(confirmations).then((receipt: ContractReceipt) => {
      receipt.events = receipt.logs.map((log: Log) => {
        const event = <Event>deepCopy(log);
        let parsed: LogDescription | undefined;
        try {
          parsed = contract.interface.parseLog(log);
        } catch (e) {
          // ignore
        }

        // Successfully parsed the event log; include it
        if (parsed) {
          event.args = parsed.args;
          event.decode = (data: BytesLike, topics?: Array<string>) => {
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
