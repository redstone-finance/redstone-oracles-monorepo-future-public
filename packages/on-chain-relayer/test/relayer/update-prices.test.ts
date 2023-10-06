import {
  btcDataFeed,
  deployMockSortedOracles,
  getDataPackagesResponse,
  mockEnvVariables,
} from "../helpers";
mockEnvVariables();
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { PriceFeedsAdapterWithoutRoundsMock } from "../../typechain-types";
import { updatePrices } from "../../src/core/contract-interactions/update-prices";
import { server } from "./mock-server";
import { parseUnits } from "ethers/lib/utils";
import * as getProviderOrSigner from "../../src/core/contract-interactions/get-provider-or-signer";
import { getUpdatePricesArgs } from "../../src/args/get-update-prices-args";
import { Wallet } from "ethers";

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
    // Deploy contract
    const PriceFeedsAdapterFactory = await ethers.getContractFactory(
      "PriceFeedsAdapterWithoutRoundsMock"
    );
    let priceFeedsAdapter: PriceFeedsAdapterWithoutRoundsMock =
      await PriceFeedsAdapterFactory.deploy();
    await priceFeedsAdapter.deployed();
    priceFeedsAdapter = priceFeedsAdapter.connect(
      new Wallet(TEST_PRIVATE_KEY).connect(ethers.provider)
    );

    // Update prices
    const dataPackages = await getDataPackagesResponse();
    const updatePricesArgs = getUpdatePricesArgs(
      dataPackages,
      priceFeedsAdapter
    );

    await updatePrices(updatePricesArgs);

    // Check updated values
    const dataFeedsValues = await priceFeedsAdapter.getValuesForDataFeeds([
      btcDataFeed,
    ]);
    expect(dataFeedsValues[0]).to.be.equal(2307768000000);
  });

  it("should update prices in mento adapter", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (getProviderOrSigner as any).getProvider = () => ethers.provider;

    // Deploying sorted oracles
    const sortedOracles = await deployMockSortedOracles();

    // Deploying mento adapter
    const MentoAdapterFactory =
      await ethers.getContractFactory("MentoAdapterMock");
    const mentoAdapter = await MentoAdapterFactory.deploy();
    await mentoAdapter.deployed();

    // Setting sorted oracles contract address
    await mentoAdapter.setSortedOraclesAddress(sortedOracles.address);

    // Mocking config
    const overrideMockConfig = {
      adapterContractType: "mento",
      updateConditions: ["time"],
    };
    mockEnvVariables(overrideMockConfig);

    // Update prices
    const dataPackages = await getDataPackagesResponse();
    const updatePricesArgs = getUpdatePricesArgs(dataPackages, mentoAdapter);

    await updatePrices(updatePricesArgs);

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
