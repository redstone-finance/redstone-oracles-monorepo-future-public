import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import * as hardhat from "hardhat";
import * as viem from "viem";
import { generate7412CompatibleCall } from "../src/generate7412CompatibleCall";

chai.use(chaiAsPromised);

describe("erc7412 redstone feed show case", () => {
  it("should set price for erc7412 redstone feed and retrive it from cache", async () => {
    // deploy erc7412 redstone price feed
    const btcPriceFeed = await hardhat.viem.deployContract("BTCFeed");

    // this contract is deployed on almost every network with same deterministic address "0xcA11bde05977b3631167028862bE2a173976CA11";
    const multicall = await hardhat.viem.deployContract("Multicall3");

    // this would normal client like
    const [wallet] = await hardhat.viem.getWalletClients();
    const publicClient = await hardhat.viem.getPublicClient();

    // encode call data call (this could be call to another contract, which call BTCFeed)
    const callData = viem.encodeFunctionData({
      functionName: "latestAnswer",
      abi: btcPriceFeed.abi,
    });

    // this function will simulate transaction if transaction fails,
    // because of the ERC7412.OracleDataRequiredError it will fetch it from redstone gateway
    // pack into callData as multicallRequest and return it
    const call = await generate7412CompatibleCall(
      publicClient,
      btcPriceFeed.address,
      wallet.account.address,
      callData,
      multicall.address
    );

    // send transaction to multicall contract
    await wallet.sendTransaction(call);

    // read "cached" value from price feed
    // data is valid until getTTL value
    console.log(
      "BTC price: ",
      await publicClient.readContract({
        functionName: "latestAnswer",
        abi: btcPriceFeed.abi,
        address: btcPriceFeed.address,
      })
    );
  });
});
