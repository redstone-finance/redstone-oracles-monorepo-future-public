import { ContractParamsProvider, sampleRun } from "@redstone-finance/sdk";
import { provider } from "./common/provider";
import { readProxyContractId } from "./common/read-proxy-contract-id";
import { connectPricesContract } from "./prices/prices-contract-test-utils";

const IS_LOCAL = true as boolean;

async function main() {
  const paramsProvider = new ContractParamsProvider({
    dataServiceId: "redstone-primary-prod",
    uniqueSignersCount: 5,
    dataPackagesIds: ["ETH", "BTC"],
  });

  const pricesConnector = await connectPricesContract(
    readProxyContractId(),
    false,
    await provider(IS_LOCAL)
  );

  await sampleRun(paramsProvider, pricesConnector);
}

void main();
