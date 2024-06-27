import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { ethers } from "hardhat";
import { IRedstoneAdapter } from "../typechain-types";

const SLEEP_TIME_MS = 15 * 60 * 1000;
const GAS_LIMIT = 8_000_000;

const contractNames = [
  "PriceFeedsAdapterWithRoundsBenchmark",
  "PriceFeedsAdapterWithoutRoundsBenchmark",
  "SinglePriceFeedAdapterBenchmark",
  "SinglePriceFeedAdapterWithClearingBenchmark",
];

void main();

async function main() {
  for (const contractName of contractNames) {
    console.log(`\n=== Benchmarking contract: ${contractName} ===`);
    await benchmarkContract(contractName);
  }
}

async function benchmarkContract(contractName: string) {
  const contract = await deployContract(contractName);

  for (let i = 1; i <= 3; i++) {
    const btcMockValue = i * 100;
    const mockDataTimestamp = Date.now();

    // Wrapping contract with RedStone payload
    const wrappedContract = WrapperBuilder.wrap(
      contract
    ).usingSimpleNumericMock({
      mockSignersCount: 2,
      timestampMilliseconds: mockDataTimestamp,
      dataPoints: [{ dataFeedId: "BTC", value: btcMockValue }],
    }) as IRedstoneAdapter;

    // Evaluating gas costs
    console.log(`Running test iteration nr: ${i}...`);
    const tx = await wrappedContract.updateDataFeedsValues(mockDataTimestamp, {
      gasLimit: GAS_LIMIT,
    });
    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Gas used: ${String(receipt.gasUsed)}`);

    console.log(`Sleeping for ${SLEEP_TIME_MS} ms...`);
    await sleep(SLEEP_TIME_MS);
  }
}

async function sleep(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

async function deployContract(contractName: string) {
  const factory = await ethers.getContractFactory(contractName);

  // Deploy the contract
  console.log("Deploying contract: " + contractName);
  const contract = await factory.deploy();
  await contract.deployed();
  console.log("Contract deployed to: " + contract.address);
  return contract;
}
