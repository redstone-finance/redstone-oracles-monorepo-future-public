import { ContractParamsProvider, sampleRun } from "@redstone-finance/sdk";
import { Provider } from "fuels";
import { readDeployedHex } from "./common/read-deployed-hex";
import { connectPricesContract } from "./prices/prices-contract-test-utils";

const IS_LOCAL = false as boolean;

const provider = async () => {
  return IS_LOCAL
    ? undefined
    : await Provider.create("https://testnet.fuel.network/v1/graphql");
};

async function main() {
  const paramsProvider = new ContractParamsProvider({
    dataServiceId: "redstone-avalanche-prod",
    uniqueSignersCount: 1,
    dataPackagesIds: ["ETH", "BTC"],
  });

  const pricesConnector = await connectPricesContract(
    readDeployedHex(),
    false,
    await provider()
  );

  await sampleRun(paramsProvider, pricesConnector);
}

void main();
