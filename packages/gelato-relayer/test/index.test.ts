import { Web3FunctionHardhat } from "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import { expect } from "chai";
import hre from "hardhat";
import * as args from "./userArgs.json";

import { Web3FunctionResultCallData } from "@gelatonetwork/web3-functions-sdk";
import * as fs from "node:fs";
import path from "path";

const { w3f } = hre;

const CONDITION_NOT_SATISFIED_MESSAGE =
  /Update condition NOT satisfied; block_number=12221/;
describe("RedStone Gelato w3f Tests", function () {
  this.timeout(0);

  let redstoneW3f: Web3FunctionHardhat;

  beforeEach(function () {
    redstoneW3f = w3f.get("redstone-mock");
  });

  it("Return canExec: true when update is needed", async () => {
    const callData = await performCanExecTest(prepareUserArgs());

    expect(callData).to.match(/0xc14c9204.*002ed57011e0000/);
  });

  it("Return canExec: true when update is needed in multi-feed", async () => {
    const callData = await performCanExecTest(
      prepareUserArgs(true, "./manifestMultiFeed.json"),
      "0xfcd454d19f9B8806F8908e99d85b8eA17b3c7346"
    );

    expect(callData).to.match(/0xb7a16251.*002ed57011e0000/);
  });

  it("Return canExec: false (Skipping) when update is not needed", async () => {
    const message = await performShouldNotExecTest(
      redstoneW3f,
      prepareUserArgs(false)
    );

    expect(message).to.match(CONDITION_NOT_SATISFIED_MESSAGE);
  });

  it("Return canExec: false (Skipping) when update is not needed in multi-feed", async () => {
    const message = await performShouldNotExecTest(
      redstoneW3f,
      prepareUserArgs(false, "./manifestMultiFeed.json")
    );

    expect(message).to.match(CONDITION_NOT_SATISFIED_MESSAGE);
  });

  function prepareUserArgs(
    shouldUpdatePrices = true,
    manifestPath = "./manifest.json"
  ) {
    const userArgs = { ...args };

    userArgs.shouldUpdatePrices = shouldUpdatePrices;
    userArgs.message = shouldUpdatePrices
      ? "Update needed"
      : "Update NOT needed";
    userArgs.localManifestData = Buffer.from(
      fs.readFileSync(path.join(__dirname, manifestPath))
    ).toString("base64");

    return userArgs;
  }

  async function performCanExecTest(
    userArgs: typeof args,
    adapterContractAddress = "0x11B714817cBC92D402383cFd3f1037B122dcf69A"
  ) {
    const { result } = await redstoneW3f.run("onRun", { userArgs });
    expect(result.canExec).to.equal(true);

    const callData = (
      result as {
        canExec: true;
        callData: Web3FunctionResultCallData[];
      }
    ).callData;

    expect(callData.length).to.equal(1);
    expect(callData[0].to).to.equal(adapterContractAddress);

    return callData[0].data;
  }

  async function performShouldNotExecTest(
    redstoneW3f: Web3FunctionHardhat,
    userArgs: typeof args
  ) {
    const { result } = await redstoneW3f.run("onRun", { userArgs });
    expect(result.canExec).to.equal(false);

    return (
      result as {
        canExec: false;
        message: string;
      }
    ).message;
  }
});
