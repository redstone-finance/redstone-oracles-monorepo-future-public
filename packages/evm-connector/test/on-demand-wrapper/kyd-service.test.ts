import { ScoreType } from "@redstone-finance/protocol";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { WrapperBuilder } from "../../src/index";
import { SampleKydServiceConsumer } from "../../typechain-types";
import { server } from "./mock-server";

describe.skip("SampleKydServiceConsumer", () => {
  let contract: SampleKydServiceConsumer;

  before(async () => {
    server.listen();
    await network.provider.send("hardhat_reset");
  });
  beforeEach(async () => {
    contract = await getContract();
  });

  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it("Address should pass KYD", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
      [
        "http://first-node.com/score-by-address",
        "http://second-node.com/score-by-address",
      ],
      ScoreType.coinbaseKYD
    );
    const transaction = await wrappedContract.executeActionPassingKYD();
    await transaction.wait();
    const passedKydValue = await contract.getPassedKYDValue();
    expect(passedKydValue).to.be.equal(true);
  });

  it("Address shouldn't pass KYD", async () => {
    contract = await getContract(false);
    const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
      [
        "http://first-node.com/score-by-address",
        "http://second-node.com/score-by-address",
      ],
      ScoreType.coinbaseKYD
    );
    await expect(wrappedContract.executeActionPassingKYD())
      .to.be.revertedWith(`UserDidNotPassKYD`)
      .withArgs("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  });

  it("Should revert if invalid response from one node", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
      [
        "http://first-node.com/score-by-address",
        "http://invalid-address-node.com/score-by-address",
      ],
      ScoreType.coinbaseKYD
    );
    await expect(wrappedContract.executeActionPassingKYD())
      .to.be.revertedWith("InsufficientNumberOfUniqueSigners")
      .withArgs(1, 2);
  });

  it("Should revert if one value from node is not equal", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
      [
        "http://first-node.com/score-by-address",
        "http://invalid-value-node.com/score-by-address",
      ],
      ScoreType.coinbaseKYD
    );
    await expect(wrappedContract.executeActionPassingKYD())
      .to.be.revertedWith("AllValuesMustBeEqual")
      .withArgs();
  });

  it("Should revert if two calls to the same node", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
      [
        "http://first-node.com/score-by-address",
        "http://first-node.com/score-by-address",
      ],
      ScoreType.coinbaseKYD
    );
    await expect(wrappedContract.executeActionPassingKYD())
      .to.be.revertedWith("InsufficientNumberOfUniqueSigners")
      .withArgs(1, 2);
  });
});

const getContract = async (
  isValidSigner: boolean = true
): Promise<SampleKydServiceConsumer> => {
  const signers = await ethers.getSigners();
  const ContractFactory = await ethers.getContractFactory(
    "SampleKydServiceConsumer",
    isValidSigner ? signers[0] : signers[1]
  );
  const contract = await ContractFactory.deploy();
  await contract.deployed();
  return contract;
};
