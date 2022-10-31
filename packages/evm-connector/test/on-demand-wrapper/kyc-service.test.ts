import { expect } from "chai";
import { ethers } from "hardhat";
import { ScoreType } from "redstone-protocol";
import { WrapperBuilder } from "../../src/index";
import { SampleKycServiceConsumer } from "../../typechain-types";
import { server } from "../helpers/mock-server";

describe("SampleKycServiceConsumer", () => {
  before(() => server.listen());

  afterEach(() => server.resetHandlers());

  it("Address should pass KYC", async () => {
    const contract = await getContract();
    const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
      [
        "http://first-node.com/score-by-address",
        "http://second-node.com/score-by-address",
      ],
      ScoreType.coinbaseKYC
    );
    const transaction = await wrappedContract.executeActionPassingKYC();
    await transaction.wait();
    const passedKycValue = await contract.getPassedKYCValue();
    expect(passedKycValue).to.be.equal(true);
  });

  it("Address shouldn't pass KYC", async () => {
    const contract = await getContract(false);
    const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
      [
        "http://first-node.com/score-by-address",
        "http://second-node.com/score-by-address",
      ],
      ScoreType.coinbaseKYC
    );
    await expect(wrappedContract.executeActionPassingKYC()).to.be.revertedWith(
      "User didn't pass KYC"
    );
  });

  it("Should revert if invalid response from one node", async () => {
    const contract = await getContract();
    const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
      [
        "http://first-node.com/score-by-address",
        "http://invalid-address-node.com/score-by-address",
      ],
      ScoreType.coinbaseKYC
    );
    await expect(wrappedContract.executeActionPassingKYC()).to.be.revertedWith(
      "Insufficient number of unique signers"
    );
  });

  it("Should revert if one value from node is not equal", async () => {
    const contract = await getContract();
    const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
      [
        "http://first-node.com/score-by-address",
        "http://invalid-value-node.com/score-by-address",
      ],
      ScoreType.coinbaseKYC
    );
    await expect(wrappedContract.executeActionPassingKYC()).to.be.revertedWith(
      "All values must be equal"
    );
  });

  it("Should revert if two calls to the same node", async () => {
    const contract = await getContract();
    const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
      [
        "http://first-node.com/score-by-address",
        "http://first-node.com/score-by-address",
      ],
      ScoreType.coinbaseKYC
    );
    await expect(wrappedContract.executeActionPassingKYC()).to.be.revertedWith(
      "Insufficient number of unique signers"
    );
  });

  after(() => server.close());
});

const getContract = async (
  isValidSigner: boolean = true
): Promise<SampleKycServiceConsumer> => {
  const signers = await ethers.getSigners();
  const ContractFactory = await ethers.getContractFactory(
    "SampleKycServiceConsumer",
    isValidSigner ? signers[0] : signers[1]
  );
  const contract = await ContractFactory.deploy();
  await contract.deployed();
  return contract;
};
