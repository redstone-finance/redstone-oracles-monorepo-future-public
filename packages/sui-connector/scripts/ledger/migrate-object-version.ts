import { DEFAULT_GAS_BUDGET, readIds, SuiNetworkName } from "../../src";
import { generateTransactionData } from "./generate-transaction-data";

const VERSION = 2;

void generateTransactionData((tx, network: SuiNetworkName) => {
  const config = readIds(network);

  tx.setGasBudget(DEFAULT_GAS_BUDGET);
  tx.moveCall({
    target: `${config.packageId}::price_adapter::migrate_to_version_${VERSION}`,
    arguments: [
      tx.object(config.adminCapId),
      tx.object(config.priceAdapterObjectId),
    ],
  });
});
