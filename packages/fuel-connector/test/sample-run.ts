import { ContractParamsProvider, sampleRun } from "@redstone-finance/sdk";
import { provider } from "./common/provider";
import { readDeployedHex } from "./common/read-deployed-hex";
import { connectPricesContract } from "./prices/prices-contract-test-utils";

const IS_LOCAL = false as boolean;

async function main() {
  const paramsProvider = new ContractParamsProvider({
    dataServiceId: "redstone-avalanche-prod",
    uniqueSignersCount: 1,
    dataPackagesIds: ["ETH", "BTC"],
  });

  const pricesConnector = await connectPricesContract(
    readDeployedHex(),
    false,
    await provider(IS_LOCAL)
  );

  await sampleRun(paramsProvider, pricesConnector);
}

void main();
