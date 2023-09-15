import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { formatBytes32String, parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
import {
  calculateLinkedListPosition,
  prepareLinkedListLocationsForMentoAdapterReport,
} from "../../../../src/custom-integrations/mento/mento-utils";
import {
  MentoAdapterBase,
  MockSortedOracles,
} from "../../../../typechain-types";
import { deployMockSortedOracles } from "../../../helpers";

chai.use(chaiAsPromised);

describe("MentoAdapter", () => {
  let sortedOracles: MockSortedOracles;
  let mentoAdapter: MentoAdapterBase;
  let signers: SignerWithAddress[];

  const mockToken1Address = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"; // CELO token address
  const mockToken2Address = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // cUSD token address

  const normalizeValue = (num: number) => parseUnits(num.toString(), 24);

  const reportDirectly = async (
    tokenAddress: string,
    valueToReport: number,
    signer: SignerWithAddress
  ) => {
    const rates = await sortedOracles.getRates(tokenAddress);
    const { lesserKey, greaterKey } = calculateLinkedListPosition(
      rates,
      normalizeValue(valueToReport),
      signer.address
    );

    const tx = await sortedOracles
      .connect(signer)
      .report(
        tokenAddress,
        normalizeValue(valueToReport),
        lesserKey,
        greaterKey
      );
    await tx.wait();
  };

  const reportWithAdapter = async (
    mockToken1Value: number,
    mockToken2Value: number
  ) => {
    // Wrapping contract
    const dataPoints = [
      { dataFeedId: "MOCK1", value: mockToken1Value },
      { dataFeedId: "MOCK2", value: mockToken2Value },
    ];
    const blockTimestamp = await time.latest();
    const timestampMilliseconds = blockTimestamp * 1000;
    await time.setNextBlockTimestamp(blockTimestamp + 10);
    const wrapContract = (contract: MentoAdapterBase) =>
      WrapperBuilder.wrap(contract).usingSimpleNumericMock({
        mockSignersCount: 10,
        dataPoints,
        timestampMilliseconds,
      }) as MentoAdapterBase;

    // Prepare arguments
    const proposedTimestamp = timestampMilliseconds;
    const locationsInSortedLinkedLists =
      await prepareLinkedListLocationsForMentoAdapterReport({
        mentoAdapter,
        wrapContract,
        sortedOracles,
      });

    // Updating oracle values
    await wrapContract(mentoAdapter).updatePriceValues(
      proposedTimestamp,
      locationsInSortedLinkedLists
    );
  };

  const expectOracleValues = async (
    tokenAddress: string,
    expectedValues: number[]
  ) => {
    const [, oracleValues] = await sortedOracles.getRates(tokenAddress);
    const expectedValuesNormalized = expectedValues.map(normalizeValue);
    expect(oracleValues).to.eql(expectedValuesNormalized);
  };

  before(async () => {
    signers = await ethers.getSigners();
  });

  beforeEach(async () => {
    // Deploying sorted oracles
    sortedOracles = await deployMockSortedOracles();

    // Deploying mento adapter
    const MentoAdapterFactory =
      await ethers.getContractFactory("MentoAdapterMock");
    mentoAdapter = await MentoAdapterFactory.deploy(sortedOracles.address);
    await mentoAdapter.deployed();

    // Registering data feeds
    await mentoAdapter.setDataFeed(
      formatBytes32String("MOCK1"),
      mockToken1Address
    );
    await mentoAdapter.setDataFeed(
      formatBytes32String("MOCK2"),
      mockToken2Address
    );
  });

  it("Should report oracle values", async () => {
    await reportWithAdapter(42, 1200);
    await expectOracleValues(mockToken1Address, [42]);
    await expectOracleValues(mockToken2Address, [1200]);
  });

  it("Should report oracle values with other oracles", async () => {
    // Iteration 1
    await reportDirectly(mockToken1Address, 40, signers[0]);
    await reportDirectly(mockToken1Address, 100, signers[1]);
    await reportWithAdapter(42, 1199);
    await expectOracleValues(mockToken1Address, [100, 42, 40]);
    await expectOracleValues(mockToken2Address, [1199]);

    // Iteration 2
    await reportDirectly(mockToken1Address, 100, signers[0]);
    await reportDirectly(mockToken1Address, 101, signers[1]);
    await reportWithAdapter(45, 16);
    await expectOracleValues(mockToken1Address, [101, 100, 45]);
    await expectOracleValues(mockToken2Address, [16]);

    // Iteration 3
    await reportDirectly(mockToken1Address, 1, signers[0]);
    await reportWithAdapter(42, 160);
    await reportDirectly(mockToken2Address, 30, signers[0]);
    await reportDirectly(mockToken1Address, 30, signers[1]);
    await expectOracleValues(mockToken1Address, [42, 30, 1]);
    await expectOracleValues(mockToken2Address, [160, 30]);
  });

  it("Should remove a data feed", async () => {
    await mentoAdapter.removeDataFeed(formatBytes32String("MOCK2"));
    const dataFeedIds = await mentoAdapter.getDataFeedIds();
    expect(dataFeedIds.length).to.eq(1);
    expect(dataFeedIds[0]).to.eq(formatBytes32String("MOCK1"));
  });

  it("Should update a sorted oracle address", async () => {
    expect(await mentoAdapter.sortedOracles()).to.eq(sortedOracles.address);

    const newSortedOraclesAddress =
      "0x0000000000000000000000000000000000000000";
    await mentoAdapter.updateSortedOraclesAddress(newSortedOraclesAddress);

    expect(await mentoAdapter.sortedOracles()).to.eq(newSortedOraclesAddress);
  });
});
