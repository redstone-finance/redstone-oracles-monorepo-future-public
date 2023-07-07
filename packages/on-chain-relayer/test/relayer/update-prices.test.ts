import {
  btcDataFeed,
  dataFeedsIds,
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
import { getLastRoundParamsFromContract } from "../../src/core/contract-interactions/get-last-round-params";
import { server } from "./mock-server";
import { parseUnits } from "ethers/lib/utils";
import * as getProviderOrSigner from "../../src/core/contract-interactions/get-provider-or-signer";

chai.use(chaiAsPromised);

const mockToken1Address = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"; // CELO token address
const mockToken2Address = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // cUSD token address

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
    const priceFeedsAdapter: PriceFeedsAdapterWithoutRoundsMock =
      await PriceFeedsAdapterFactory.deploy();
    await priceFeedsAdapter.deployed();

    // Update prices
    const { lastUpdateTimestamp } = await getLastRoundParamsFromContract(
      priceFeedsAdapter
    );
    const dataPackages = await getDataPackagesResponse();
    await updatePrices(dataPackages, priceFeedsAdapter, lastUpdateTimestamp);

    // Check updated values
    const dataFeedsValues = await priceFeedsAdapter.getValuesForDataFeeds([
      btcDataFeed,
    ]);
    expect(dataFeedsValues[0]).to.be.equal(2307768000000);
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
    const { lastUpdateTimestamp } = await getLastRoundParamsFromContract(
      mentoAdapter
    );
    const dataPackages = await getDataPackagesResponse();
    await updatePrices(dataPackages, mentoAdapter, lastUpdateTimestamp);

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
