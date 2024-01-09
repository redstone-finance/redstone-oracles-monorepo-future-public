import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { calculateLinkedListPosition } from "../../../../src/custom-integrations/mento/mento-utils";
import { MockSortedOracles } from "../../../../typechain-types";
import { deployMockSortedOracles } from "../../../helpers";

describe("MockSortedOracles", () => {
  let contract: MockSortedOracles;
  let signers: SignerWithAddress[];

  const mockTokenAddress = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"; // CELO token address

  const reportNewOracleValue = async (
    valueToReport: number,
    signer: SignerWithAddress,
    maxAllowedDeviation = Number.MAX_SAFE_INTEGER
  ) => {
    const rates = await contract.getRates(mockTokenAddress);
    const insertPositions = calculateLinkedListPosition(
      rates,
      BigNumber.from(valueToReport),
      signer.address,
      maxAllowedDeviation
    );
    if (!insertPositions) {
      return undefined;
    }

    const { lesserKey, greaterKey } = insertPositions;

    const tx = await contract
      .connect(signer)
      .report(mockTokenAddress, valueToReport, lesserKey, greaterKey);
    return await tx.wait();
  };

  const expectOracleValues = async (expectedValues: number[]) => {
    const [, oracleValues] = await contract.getRates(mockTokenAddress);
    expect(oracleValues).to.eql(expectedValues.map(BigNumber.from));
  };

  before(async () => {
    signers = await ethers.getSigners();
  });

  beforeEach(async () => {
    contract = await deployMockSortedOracles();
  });

  it("Different oracles should properly report their values", async () => {
    await reportNewOracleValue(42, signers[0]);
    await expectOracleValues([42]);

    await reportNewOracleValue(44, signers[1]);
    await expectOracleValues([44, 42]);

    await reportNewOracleValue(43, signers[2]);
    await expectOracleValues([44, 43, 42]);

    await reportNewOracleValue(1, signers[3]);
    await expectOracleValues([44, 43, 42, 1]);

    await reportNewOracleValue(1000, signers[4]);
    await expectOracleValues([1000, 44, 43, 42, 1]);
  });

  it("The same oracle should properly update their value", async () => {
    await reportNewOracleValue(42, signers[0]);
    await expectOracleValues([42]);

    await reportNewOracleValue(45, signers[0]);
    await expectOracleValues([45]);

    await reportNewOracleValue(43, signers[0]);
    await expectOracleValues([43]);

    await reportNewOracleValue(1, signers[0]);
    await expectOracleValues([1]);

    await reportNewOracleValue(100, signers[0]);
    await expectOracleValues([100]);
  });

  it("2 iterations of oracle reports", async () => {
    // Iteration 1
    await reportNewOracleValue(42, signers[0]);
    await expectOracleValues([42]);

    await reportNewOracleValue(44, signers[1]);
    await expectOracleValues([44, 42]);

    await reportNewOracleValue(43, signers[2]);
    await expectOracleValues([44, 43, 42]);

    // Iteration 2
    await reportNewOracleValue(42, signers[0]);
    await expectOracleValues([44, 43, 42]);

    await reportNewOracleValue(100, signers[1]);
    await expectOracleValues([100, 43, 42]);

    await reportNewOracleValue(1000, signers[2]);
    await expectOracleValues([1000, 100, 42]);
  });

  it("Too deviated values should not cause updates", async () => {
    await reportNewOracleValue(42, signers[0], 10);
    await expectOracleValues([42]);

    await reportNewOracleValue(44, signers[1], 10);
    await expectOracleValues([44, 42]);

    await reportNewOracleValue(43, signers[2], 10);
    await expectOracleValues([44, 43, 42]);

    await reportNewOracleValue(1, signers[3], 10);
    await expectOracleValues([44, 43, 42]);

    await reportNewOracleValue(1000, signers[4], 10);
    await expectOracleValues([44, 43, 42]);
  });
});
