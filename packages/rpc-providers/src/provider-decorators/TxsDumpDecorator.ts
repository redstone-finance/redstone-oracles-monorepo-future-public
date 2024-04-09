import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { providers } from "ethers";
import { Deferrable } from "ethers/lib/utils";
import { appendFileSync } from "fs";

export function TxDumpDecorator(factory: () => providers.Provider) {
  const newFactory = () => {
    const provider = factory();

    const oldCall = provider.call.bind(provider);
    const chainIdPromise = provider.getNetwork().then((n) => n.chainId);

    provider.call = async (
      transaction: Deferrable<TransactionRequest>,
      blockTag?: BlockTag
    ) => {
      const info = {
        to: (await transaction.to)!,
        callData: (await transaction.data) as string,
        chainId: await chainIdPromise,
      };

      appendFileSync("transactions_dump.json", JSON.stringify(info) + ",\n");

      return await oldCall(transaction, blockTag);
    };
    return provider;
  };

  return newFactory;
}
