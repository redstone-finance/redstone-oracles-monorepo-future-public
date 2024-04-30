import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { providers } from "ethers";
import { Deferrable } from "ethers/lib/utils";
import { getProviderNetworkInfo } from "../common";

export function Treat0xAsErrorDecorator(factory: () => providers.Provider) {
  const newFactory = () => {
    const provider = factory();

    const oldCall = provider.call.bind(provider);
    const providerInfo = getProviderNetworkInfo(provider);

    provider.call = async (
      transaction: Deferrable<TransactionRequest>,
      blockTag?: BlockTag
    ) => {
      const result = await oldCall(transaction, blockTag);

      if (result === "0x") {
        throw new Error(
          `Provider ${providerInfo.url} has returned 0x as response`
        );
      }

      return result;
    };
    return provider;
  };

  return newFactory;
}
