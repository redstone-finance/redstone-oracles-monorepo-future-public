import { expect } from "chai";
import { ethers } from "hardhat";
import { ScoreType } from "redstone-protocol";
import { WrapperBuilder } from "../../src/index";
import { SampleKydServiceConsumer } from "../../typechain-types";
import { server } from "../helpers/mock-server";

describe("SampleKydServiceConsumer", () => {
  before(() => server.listen());

  afterEach(() => server.resetHandlers());

  it("Address should pass KYD", async () => {
    const contract = await getContract();
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
    const contract = await getContract(false);
    const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
      [
        "http://first-node.com/score-by-address",
        "http://second-node.com/score-by-address",
      ],
      ScoreType.coinbaseKYD
    );
    await expect(wrappedContract.executeActionPassingKYD()).to.be.revertedWith(
      `UserDidNotPassKYD("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")`
    );
  });

  it("Should revert if invalid response from one node", async () => {
    const contract = await getContract();
    const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
      [
        "http://first-node.com/score-by-address",
        "http://invalid-address-node.com/score-by-address",
      ],
      ScoreType.coinbaseKYD
    );
    await expect(wrappedContract.executeActionPassingKYD()).to.be.revertedWith(
      "InsufficientNumberOfUniqueSigners(1, 2)"
    );
  });

  it("Should revert if one value from node is not equal", async () => {
    const contract = await getContract();
    const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
      [
        "http://first-node.com/score-by-address",
        "http://invalid-value-node.com/score-by-address",
      ],
      ScoreType.coinbaseKYD
    );
    await expect(wrappedContract.executeActionPassingKYD()).to.be.revertedWith(
      "AllValuesMustBeEqual()"
    );
  });

  it("Should revert if two calls to the same node", async () => {
    const contract = await getContract();
    const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
      [
        "http://first-node.com/score-by-address",
        "http://first-node.com/score-by-address",
      ],
      ScoreType.coinbaseKYD
    );
    await expect(wrappedContract.executeActionPassingKYD()).to.be.revertedWith(
      "InsufficientNumberOfUniqueSigners(1, 2)"
    );
  });

  after(() => server.close());
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
