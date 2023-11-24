import { MultiNodeTxBroadcaster } from "@redstone-finance/rpc-providers";
import { RedstoneAdapterBase } from "../../typechain-types";
import { UpdatePricesArgs } from "../args/get-iteration-args";
import { config } from "../config";
import { getTxDeliveryMan } from "./TxDeliveryManSingleton";

export async function simulateUpdateDataFeeds(
  iterationArgs: {
    shouldUpdatePrices: boolean;
    args: UpdatePricesArgs<RedstoneAdapterBase>;
    message?: string | undefined;
  },
  adapterContract: RedstoneAdapterBase
) {
  if (config().adapterContractType !== "price-feeds") {
    return;
  }
  console.log("Simulating test transaction");
  const adapter =
    iterationArgs.args.dataPackagesWrapper.overwriteEthersContract(
      adapterContract
    );

  const { transactionRequest } =
    await getTxDeliveryMan().prepareTransactionRequest(
      adapter,
      "updateDataFeedsValues",
      [iterationArgs.args.proposedTimestamp],
      new MultiNodeTxBroadcaster(adapter)
    );

  console.log("Simulated tx", JSON.stringify(transactionRequest, null, 2));

  const result = await adapterContract.provider.call(transactionRequest);

  // it will throw in case of contract logic error
  adapterContract.interface.decodeFunctionResult(
    "updateDataFeedsValues",
    result
  );
  console.log("Simulated first transaction successfully");
}
