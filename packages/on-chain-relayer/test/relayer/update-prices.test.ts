import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { PriceFeedsAdapterMock } from "../../typechain-types";
import { updatePrices } from "../../src/core/contract-interactions/update-prices";
import { getLastRoundParamsFromContract } from "../../src/core/contract-interactions/get-last-round-params";
import { server } from "./mock-server";
import {
  dataFeedsIds,
  deployMockSortedOracles,
  getDataPackagesResponse,
  mockEnvVariables,
} from "../helpers";
import { parseUnits } from "ethers/lib/utils";
import * as getProviderOrSigner from "../../src/core/contract-interactions/get-provider-or-signer";

chai.use(chaiAsPromised);

const mockToken1Address = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"; // CELO token address
const mockToken2Address = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // cUSD token address

describe("#updatePrices", () => {
  before(() => {
    mockEnvVariables();
    server.listen();
  });

  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it("should update price in price-feeds adapter", async () => {
    // Deploy contract
    const PriceFeedsAdapterFactory = await ethers.getContractFactory(
      "PriceFeedsAdapterMock"
    );
    const priceFeedsAdapter: PriceFeedsAdapterMock =
      await PriceFeedsAdapterFactory.deploy(dataFeedsIds);
    await priceFeedsAdapter.deployed();

    // Update prices
    const { lastRound, lastUpdateTimestamp } =
      await getLastRoundParamsFromContract(priceFeedsAdapter);
    const dataPackages = getDataPackagesResponse();
    await updatePrices(
      dataPackages,
      priceFeedsAdapter,
      lastRound,
      lastUpdateTimestamp
    );

    // Check updated values
    const [round] = await priceFeedsAdapter.getLastRoundParams();
    expect(round).to.be.equal(1);
    const dataFeedsValues = await priceFeedsAdapter.getValuesForDataFeeds(
      dataFeedsIds
    );
    expect(dataFeedsValues[0]).to.be.equal(167099000000);
    expect(dataFeedsValues[1]).to.be.equal(2307768000000);
  });

  it("should update prices in mento adapter", async () => {
    (getProviderOrSigner as any).getProvider = () => ethers.provider;

    // Deploying sorted oracles
    const sortedOracles = await deployMockSortedOracles();

    // Deploying mento adapter
    const MentoAdapterFactory = await ethers.getContractFactory(
      "MentoAdapterMock"
    );
    const mentoAdapter = await MentoAdapterFactory.deploy(
      sortedOracles.address
    );
    await mentoAdapter.deployed();

    // Registering data feeds
    await mentoAdapter.setDataFeed(dataFeedsIds[0], mockToken1Address);
    await mentoAdapter.setDataFeed(dataFeedsIds[1], mockToken2Address);

    // Mocking config
    const overrideMockConfig = { adapterContractType: "mento" };
    mockEnvVariables(overrideMockConfig);

    // Update prices
    const { lastRound, lastUpdateTimestamp } =
      await getLastRoundParamsFromContract(mentoAdapter);
    const dataPackages = getDataPackagesResponse();
    await updatePrices(
      dataPackages,
      mentoAdapter,
      lastRound,
      lastUpdateTimestamp
    );

    // Check updated values in SortedOracles
    const normalizeValue = (num: number) => parseUnits(num.toString(), 24);
    const expectOracleValues = async (
      tokenAddress: string,
      expectedValues: number[]
    ) => {
      const [, oracleValues] = await sortedOracles.getRates(tokenAddress);
      const expectedValuesNormalized = expectedValues.map(normalizeValue);
      expect(oracleValues).to.eql(expectedValuesNormalized);
    };
    await expectOracleValues(mockToken1Address, [1670.99]);
    await expectOracleValues(mockToken2Address, [23077.68]);
  });
});
