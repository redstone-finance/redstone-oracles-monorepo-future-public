import { Provider } from "@ethersproject/providers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  SimpleNumericMockWrapper,
  WrapperBuilder,
} from "@redstone-finance/evm-connector";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers, upgrades, waffle } from "hardhat";
import Sinon from "sinon";
import * as get_provider from "../../../../src/core/contract-interactions/get-relayer-provider";
import {
  calculateLinkedListPosition,
  prepareLinkedListLocationsForMentoAdapterReport,
} from "../../../../src/custom-integrations/mento/mento-utils";
import { getValuesForDataFeeds } from "../../../../src/price-feeds/args/get-values-for-data-feeds";
import {
  MentoAdapterBase,
  MentoAdapterMock,
  MockSortedOracles,
} from "../../../../typechain-types";
import { deployMockSortedOracles, mockEnvVariables } from "../../../helpers";

let getProviderStub: Sinon.SinonStub<[], Provider>;

chai.use(chaiAsPromised);

interface LocationInSortedLinkedListStruct {
  lesserKey: string;
  greaterKey: string;
}

type LocationsModifierFn = (
  locationsBefore: LocationInSortedLinkedListStruct[]
) => LocationInSortedLinkedListStruct[];

describe("MentoAdapter", () => {
  let sortedOracles: MockSortedOracles;
  let mentoAdapter: MentoAdapterMock;
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
      signer.address,
      Number.MAX_SAFE_INTEGER
    )!;

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
    mockToken2Value: number,
    adapter?: MentoAdapterBase,
    locationsModifierFn: LocationsModifierFn = (l) => l,
    maxAllowedDeviation = Number.MAX_SAFE_INTEGER
  ) => {
    const adapterToTest = adapter ?? mentoAdapter;

    // Wrapping contract
    const dataPoints = [
      { dataFeedId: "BTC", value: mockToken1Value },
      { dataFeedId: "ETH", value: mockToken2Value },
    ];
    const blockTimestamp = await time.latest();
    const timestampMilliseconds = blockTimestamp * 1000;
    await time.setNextBlockTimestamp(blockTimestamp + 10);
    const wrapContract = (contract: MentoAdapterBase) =>
      WrapperBuilder.wrap(contract).usingSimpleNumericMock({
        mockSignersCount: 10,
        dataPoints,
        timestampMilliseconds,
      });
    const dataPackagesWrapper = new SimpleNumericMockWrapper<MentoAdapterBase>({
      mockSignersCount: 10,
      dataPoints,
      timestampMilliseconds,
    });

    // Prepare arguments
    const proposedTimestamp = timestampMilliseconds;
    const locationsInSortedLinkedLists =
      await prepareLinkedListLocationsForMentoAdapterReport(
        {
          mentoAdapter: adapterToTest,
          dataPackagesWrapper,
          sortedOracles,
        },
        await adapterToTest.provider.getBlockNumber(),
        maxAllowedDeviation
      );

    if (!locationsInSortedLinkedLists) {
      return;
    } // Updating oracle values
    await wrapContract(adapterToTest).updatePriceValues(
      proposedTimestamp,
      locationsModifierFn(locationsInSortedLinkedLists)
    );
  };

  const reportWithAdapterAndDeviation = async (
    mockToken1Value: number,
    mockToken2Value: number,
    maxAllowedDeviation = Number.MAX_SAFE_INTEGER
  ) =>
    await reportWithAdapter(
      mockToken1Value,
      mockToken2Value,
      mentoAdapter,
      (l) => l,
      maxAllowedDeviation
    );

  const expectOracleValues = async (
    tokenAddress: string,
    expectedValues: number[]
  ) => {
    const [, oracleValues] = await sortedOracles.getRates(tokenAddress);
    const expectedValuesNormalized = expectedValues.map(normalizeValue);
    expect(oracleValues).to.eql(expectedValuesNormalized);
  };

  const checkCommonFunctionsForMentoAdapter = async (
    adapter: MentoAdapterBase,
    sortedOraclesAddress: string
  ) => {
    const sortedOracles = await adapter.getSortedOracles();
    expect(sortedOracles).to.eq(sortedOraclesAddress);

    const normalizedValue = await adapter.normalizeRedstoneValueForMento(42);
    expect(normalizedValue.div("1" + "0".repeat(16)).toNumber()).to.eq(42);

    await reportWithAdapter(42, 1200, adapter);
    await expectOracleValues(mockToken1Address, [42]);
    await expectOracleValues(mockToken2Address, [1200]);
  };

  const testModifiedLocations = async (
    locationsModifier: LocationsModifierFn
  ) => {
    await reportDirectly(mockToken1Address, 40, signers[0]);
    await reportDirectly(mockToken1Address, 100, signers[1]);
    await reportWithAdapter(42, 1199, mentoAdapter, locationsModifier);
    await expectOracleValues(mockToken1Address, [100, 42, 40]);
  };

  before(async () => {
    signers = await ethers.getSigners();
    getProviderStub = Sinon.stub(get_provider, "getRelayerProvider");
    getProviderStub.returns(waffle.provider);
  });

  beforeEach(async () => {
    // Deploying sorted oracles
    sortedOracles = await deployMockSortedOracles();
    mockEnvVariables({ adapterContractType: "mento" });

    // Deploying mento adapter
    const MentoAdapterFactory =
      await ethers.getContractFactory("MentoAdapterMock");
    mentoAdapter = await MentoAdapterFactory.deploy();
    await mentoAdapter.deployed();

    // Setting sorted oracles address
    await mentoAdapter.setSortedOraclesAddress(sortedOracles.address);
  });

  it("Should report oracle values", async () => {
    await checkCommonFunctionsForMentoAdapter(
      mentoAdapter,
      sortedOracles.address
    );
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

  it("Should fail if list of locations is too short", async () => {
    const modifier: LocationsModifierFn = (arr) => {
      arr.pop(); // remove the last element
      return arr;
    };
    const errMsg = "panic code 0x32"; // Array out of bound error
    await expect(testModifiedLocations(modifier)).to.be.revertedWith(errMsg);
  });

  it("Should fail if locations are invalid", async () => {
    const modifier: LocationsModifierFn = (arr) =>
      arr.map(({ greaterKey, lesserKey }) => ({
        greaterKey: lesserKey,
        lesserKey: greaterKey,
      }));
    await expect(testModifiedLocations(modifier)).to.be.revertedWith(
      "get lesser and greater failure"
    );
  });

  it("Should work properly if list of locations is just valid", async () => {
    const modifier: LocationsModifierFn = (arr) => arr;
    await testModifiedLocations(modifier);
  });

  it("Should work properly if list of locations is too long", async () => {
    const modifier: LocationsModifierFn = (arr) => [...arr].concat([...arr]);
    await testModifiedLocations(modifier);
  });

  it("Should properly upgrade mento adapter contract", async () => {
    const MentoAdapterFactory =
      await ethers.getContractFactory("MentoAdapterMock");
    const mentoAdapterV1 = (await upgrades.deployProxy(
      MentoAdapterFactory
    )) as MentoAdapterMock;
    await mentoAdapterV1.setSortedOraclesAddress(sortedOracles.address);
    const contractAddress = mentoAdapterV1.address;

    // Check contract before upgrade
    const dataFeedsCountBeforeUpgrade =
      await mentoAdapterV1.getDataFeedsCount();
    expect(dataFeedsCountBeforeUpgrade.toNumber()).to.eql(2);
    await checkCommonFunctionsForMentoAdapter(
      mentoAdapterV1,
      sortedOracles.address
    );

    // Upgrading the contract
    const MentoAdapterMockV2Factory =
      await ethers.getContractFactory("MentoAdapterMockV2");
    await upgrades.upgradeProxy(mentoAdapterV1, MentoAdapterMockV2Factory);

    // Check contract after upgrade
    const mentoAdapterV2 = await ethers.getContractAt(
      "MentoAdapterMock",
      contractAddress
    );
    await mentoAdapterV2.setSortedOraclesAddress(sortedOracles.address);
    const dataFeedsCountAfterUpgrade = await mentoAdapterV2.getDataFeedsCount();
    expect(dataFeedsCountAfterUpgrade.toNumber()).to.eql(1);
    await checkCommonFunctionsForMentoAdapter(
      mentoAdapterV2,
      sortedOracles.address
    );
  });

  it("Should not report oracle values when deviation is too big", async () => {
    await reportDirectly(mockToken1Address, 40, signers[0]);
    await reportDirectly(mockToken1Address, 42, signers[1]);

    // acceptable deviation
    await reportWithAdapterAndDeviation(42, 1000, 10);
    await expectOracleValues(mockToken1Address, [42, 42, 40]);
    await expectOracleValues(mockToken2Address, [1000]);

    // we deviate from ourselves (16 vs 1000), should get in
    await reportWithAdapterAndDeviation(45, 16, 10);
    await expectOracleValues(mockToken1Address, [45, 42, 40]);
    await expectOracleValues(mockToken2Address, [16]);

    // deviation too big: 42 vs 50
    await reportWithAdapterAndDeviation(50, 160, 10);
    await expectOracleValues(mockToken1Address, [45, 42, 40]);
    await expectOracleValues(mockToken2Address, [16]);
  });

  it("Should properly read redstone values reported to sorted oracles", async () => {
    await reportWithAdapter(1, 2, mentoAdapter);
    const values = await getValuesForDataFeeds(
      mentoAdapter,
      ["BTC", "ETH"],
      await mentoAdapter.provider.getBlockNumber()
    );
    expect(values).to.eql({
      BTC: BigNumber.from(1 * 10 ** 8),
      ETH: BigNumber.from(2 * 10 ** 8),
    });
  });
});
