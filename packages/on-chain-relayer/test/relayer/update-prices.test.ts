import { JsonRpcProvider } from "@ethersproject/providers";
import { ProviderWithAgreement } from "@redstone-finance/rpc-providers";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { Wallet } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { EvmContractConnector } from "../../src";
import { MentoEvmContractAdapter } from "../../src/core/contract-interactions/MentoEvmContractAdapter";
import { PriceFeedsEvmContractAdapter } from "../../src/core/contract-interactions/PriceFeedsEvmContractAdapter";
import { getTxDeliveryMan } from "../../src/core/TxDeliveryManSingleton";
import { PriceFeedsAdapterWithoutRoundsMock } from "../../typechain-types";
import {
  btcDataFeed,
  ContractParamsProviderMock,
  deployMockSortedOracles,
  mockConfig,
} from "../helpers";
import { server } from "./mock-server";

chai.use(chaiAsPromised);

const mockToken1Address = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"; // CELO token address
const mockToken2Address = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // cUSD token address
const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

describe("update-prices", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it("should update price in price-feeds adapter", async () => {
    const relayerConfig = mockConfig();
    // Deploy contract
    const priceFeedsAdapterFactory = await ethers.getContractFactory(
      "PriceFeedsAdapterWithoutRoundsMock"
    );
    let priceFeedsAdapter: PriceFeedsAdapterWithoutRoundsMock =
      await priceFeedsAdapterFactory.deploy();
    await priceFeedsAdapter.deployed();

    const provider = new ProviderWithAgreement([
      ethers.provider,
      ethers.provider,
    ]);
    priceFeedsAdapter = priceFeedsAdapter.connect(
      new Wallet(TEST_PRIVATE_KEY).connect(provider)
    );

    // Update prices
    const contractAdapter = await new EvmContractConnector(
      ethers.provider,
      new PriceFeedsEvmContractAdapter(
        priceFeedsAdapter,
        getTxDeliveryMan(
          relayerConfig,
          priceFeedsAdapter.signer,
          priceFeedsAdapter.provider as JsonRpcProvider
        )
      )
    ).getAdapter();
    const paramsProvider = new ContractParamsProviderMock();
    await contractAdapter.writePricesFromPayloadToContract(paramsProvider);

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
    const relayerConfig = mockConfig(overrideMockConfig);

    // Deploying sorted oracles
    const sortedOracles = await deployMockSortedOracles();

    // Deploying mento adapter
    const mentoAdapterFactory =
      await ethers.getContractFactory("MentoAdapterMock");
    let mentoAdapter = await mentoAdapterFactory.deploy();
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
    const contractAdapter = await new EvmContractConnector(
      ethers.provider,
      new MentoEvmContractAdapter(
        mentoAdapter,
        getTxDeliveryMan(
          relayerConfig,
          mentoAdapter.signer,
          mentoAdapter.provider as JsonRpcProvider
        ),
        relayerConfig.mentoMaxDeviationAllowed
      )
    ).getAdapter();
    const paramsProvider = new ContractParamsProviderMock();
    await contractAdapter.writePricesFromPayloadToContract(paramsProvider);

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
