import { TransactionReceipt } from "@ethersproject/providers";
import {
  Multicall3Caller,
  Multicall3Result,
  ProviderWithAgreement,
} from "@redstone-finance/rpc-providers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { BigNumber, Contract, Wallet } from "ethers";
import { ethers } from "hardhat";
import Sinon from "sinon";
import { abi as redstoneAdapterABI } from "../../artifacts/contracts/core/RedstoneAdapterBase.sol/RedstoneAdapterBase.json";
import { updateUsingOevAuction } from "../../src/custom-integrations/fastlane/update-using-oev-auction";
import {
  PriceFeedsAdapterWithoutRoundsMock,
  RedstoneAdapterBase,
} from "../../typechain-types";
import {
  getDataPackagesResponse,
  mockEnvVariables,
  START_OEV_AUCTION_URL,
} from "../helpers";
import { server } from "./mock-server";

chai.use(chaiAsPromised);

const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

describe("update-using-oev-auction", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it("should update price using oev auction", async () => {
    const multipartResponse: Multicall3Result[] = [
      {
        success: true,
        returnData:
          // update price feeds
          "0x0000000000000000000000000000000000000000000000000000000000000001",
      },
      {
        success: true,
        returnData:
          // get price feed values
          "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000062bb04502a9",
      },
    ];
    Sinon.stub(Multicall3Caller, "safeExecuteMulticall3").returns(
      Promise.resolve(multipartResponse)
    );

    mockEnvVariables({
      oevAuctionUrl: START_OEV_AUCTION_URL,
      dataFeeds: ["BTC"],
    });

    const provider = new ProviderWithAgreement([
      ethers.provider,
      ethers.provider,
    ]);
    provider.getGasPrice = () => Promise.resolve(BigNumber.from("1")); // gas price in transaction is 24000000000
    provider.waitForTransaction = () =>
      Promise.resolve({ status: 1 } as TransactionReceipt);
    const wallet = new Wallet(TEST_PRIVATE_KEY).connect(provider);
    // Deploy contract
    const PriceFeedsAdapterFactory = await ethers.getContractFactory(
      "PriceFeedsAdapterWithoutRoundsMock"
    );
    let priceFeedsAdapter: PriceFeedsAdapterWithoutRoundsMock =
      await PriceFeedsAdapterFactory.deploy();
    await priceFeedsAdapter.deployed();

    priceFeedsAdapter = priceFeedsAdapter.connect(wallet);

    const fetchDataPackages = () =>
      getDataPackagesResponse([
        { dataFeedId: "BTC", value: 67847.1057306512 },
        { dataFeedId: "BTC", value: 67847.10773065251 },
      ]);

    const txDeliveryCall = {
      from: "0x1",
      to: "0x2",
      data: "0x",
    };

    const adapterContract = new Contract(
      "0x61ed8EBd497d11654e91f5faFeadaAF4cB125E0C",
      redstoneAdapterABI,
      wallet
    );

    await updateUsingOevAuction(
      txDeliveryCall,
      45044689,
      adapterContract as RedstoneAdapterBase,
      await fetchDataPackages()
    );
  });
});
