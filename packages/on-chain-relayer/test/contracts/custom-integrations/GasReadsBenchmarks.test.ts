import { time } from "@nomicfoundation/hardhat-network-helpers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import {
  Hopper,
  PriceFeedsAdapterWithLowestGasRead,
} from "../../../typechain-types";

chai.use(chaiAsPromised);

const adapterContractName = "PriceFeedsAdapterWithLowestGasRead";

// enable when doing benchmarks
describe("GasReadsBenchmarks", () => {
  let adapterContract: PriceFeedsAdapterWithLowestGasRead;

  beforeEach(async () => {
    // Deploy a new adapter contract
    const adapterContractFactory =
      await ethers.getContractFactory(adapterContractName);
    adapterContract = await adapterContractFactory.deploy();
  });

  it("benchmark", async () => {
    const benchmarkContractFactory =
      await ethers.getContractFactory("ReadBenchmark");
    const benchmarkContract = await benchmarkContractFactory.deploy(
      adapterContract.address
    );

    const currentBlockTime = await time.latest();
    const nextBlockTime = currentBlockTime + 1;
    const wrappedContract = WrapperBuilder.wrap(
      adapterContract
    ).usingSimpleNumericMock({
      timestampMilliseconds: nextBlockTime * 1000,
      dataPoints: [{ dataFeedId: "BTC", value: 42 }],
      mockSignersCount: 2,
    });

    await time.setNextBlockTimestamp(nextBlockTime);
    await wrappedContract.updateDataFeedsValues(nextBlockTime * 1000);

    await benchmarkContract.readFromStateWithoutCall();
    await benchmarkContract.readFromStateWithoutCallAssembly();

    await benchmarkContract.stdReadUnsafe();
    await benchmarkContract.getBtcValueWithLowestGas();

    await benchmarkContract.readUsingStaticCall();
    await benchmarkContract.readUsingStaticCallAssembly();
    await benchmarkContract.readUsingStaticCallAssemblyWithErrorHandling();

    //remove
    await benchmarkContract.readUsingStaticCallAssemblyWithErrorHandlingWithImmutable();

    await benchmarkContract.readUsingDelegateCallAssemblyWithErrorHandling();

    await benchmarkContract.readUsingCall();
    await benchmarkContract.readUsingCallAssemblyWithErrorHandling();
  });

  it("benchmark hops", async () => {
    const hop1 = await ethers.deployContract("Hopper", [
      "0x0000000000000000000000000000000000000000",
      true,
    ]);
    const hop2 = await ethers.deployContract("Hopper", [hop1.address, false]);
    const hop3 = await ethers.deployContract("Hopper", [hop2.address, false]);
    const hop4 = await ethers.deployContract("Hopper", [hop3.address, false]);
    const hop5 = (await ethers.deployContract("Hopper", [
      hop4.address,
      false,
    ])) as Hopper;

    const tx = await hop5.nextHop();
    console.log((await tx.wait()).gasUsed.toString());
  });
});
