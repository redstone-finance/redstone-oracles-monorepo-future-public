import { ProviderWithAgreement } from "@redstone-finance/rpc-providers";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { Wallet } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { UpdatePricesArgs } from "../../src";
import { updatePrices } from "../../src/core/contract-interactions/update-prices";
import { PriceFeedsAdapterWithoutRoundsMock } from "../../typechain-types";
import {
  btcDataFeed,
  deployMockSortedOracles,
  getDataPackagesResponse,
  mockEnvVariables,
} from "../helpers";
import { server } from "./mock-server";

chai.use(chaiAsPromised);

const mockToken1Address = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"; // CELO token address
const mockToken2Address = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // cUSD token address
const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

describe("update-prices", () => {
  before(() => {
    server.listen();
  });

  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it("should update price in price-feeds adapter", async () => {
    mockEnvVariables();
    // Deploy contract
    const PriceFeedsAdapterFactory = await ethers.getContractFactory(
      "PriceFeedsAdapterWithoutRoundsMock"
    );
    let priceFeedsAdapter: PriceFeedsAdapterWithoutRoundsMock =
      await PriceFeedsAdapterFactory.deploy();
    await priceFeedsAdapter.deployed();

    const provider = new ProviderWithAgreement([
      ethers.provider,
      ethers.provider,
    ]);
    priceFeedsAdapter = priceFeedsAdapter.connect(
      new Wallet(TEST_PRIVATE_KEY).connect(provider)
    );

    // Update prices
    const updatePricesArgs: UpdatePricesArgs = {
      blockTag: await provider.getBlockNumber(),
      fetchDataPackages: getDataPackagesResponse,
    };

    await updatePrices(updatePricesArgs, priceFeedsAdapter);

    // Check updated values
    const dataFeedsValues = await priceFeedsAdapter.getValuesForDataFeeds(
      [btcDataFeed],
      { blockTag: await provider.getBlockNumber() }
    );
    expect(dataFeedsValues[0]).to.be.equal(2307768000000);
  });

  it("should update prices in mento adapter", async () => {
    // Mocking config
    const overrideMockConfig = {
      adapterContractType: "mento",
      updateConditions: {
        ETH: ["time"],
        BTC: ["time"],
      },
    };
    mockEnvVariables(overrideMockConfig);

    // Deploying sorted oracles
    const sortedOracles = await deployMockSortedOracles();

    // Deploying mento adapter
    const MentoAdapterFactory =
      await ethers.getContractFactory("MentoAdapterMock");
    let mentoAdapter = await MentoAdapterFactory.deploy();
    await mentoAdapter.deployed();

    const provider = new ProviderWithAgreement([
      ethers.provider,
      ethers.provider,
    ]);
    mentoAdapter = mentoAdapter.connect(
      new Wallet(TEST_PRIVATE_KEY).connect(provider)
    );

    // Setting sorted oracles contract address
    await mentoAdapter.setSortedOraclesAddress(sortedOracles.address);

    // Update prices
    const updatePricesArgs: UpdatePricesArgs = {
      blockTag: await provider.getBlockNumber(),
      fetchDataPackages: getDataPackagesResponse,
    };

    await updatePrices(updatePricesArgs, mentoAdapter.connect(provider));

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
    await expectOracleValues(mockToken1Address, [23077.68]);
    await expectOracleValues(mockToken2Address, [1670.99]);
  });
});
