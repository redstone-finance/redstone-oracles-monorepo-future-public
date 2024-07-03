import { Web3FunctionHardhat } from "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import { expect } from "chai";
import hre from "hardhat";
import * as args from "../web3-functions/redstone-mock/userArgs.json";

import {
  Web3FunctionResultCallData,
  Web3FunctionResultV1,
  Web3FunctionResultV2,
} from "@gelatonetwork/web3-functions-sdk";

const { w3f } = hre;

describe("RedStone Gelato w3f Tests", function () {
  this.timeout(0);

  let redstoneW3f: Web3FunctionHardhat;

  beforeEach(function () {
    redstoneW3f = w3f.get("redstone-mock");
  });

  it("Return canExec: true when update is needed", async () => {
    const userArgs = { ...args };
    userArgs.shouldUpdatePrices = true;
    userArgs.args = "0x0512341435321111a";

    const { result } = await redstoneW3f.run("onRun", { userArgs });
    expect(result.canExec).to.equal(true);

    const callData = (
      result as {
        canExec: true;
        callData: Web3FunctionResultCallData[];
      }
    ).callData;

    expect(callData.length).to.equal(1);
    expect(callData[0].to).to.equal(userArgs.adapterContractAddress);
    expect(callData[0].data).to.equal(userArgs.args);
  });

  it("Return canExec: false (Skipping) when update is not needed", async () => {
    const userArgs = { ...args };
    userArgs.shouldUpdatePrices = false;
    userArgs.message = "Update not needed";

    const { result } = await redstoneW3f.run("onRun", { userArgs });

    checkCanNotExec(result, "Update not needed");
  });

  it("Return canExec: false (Args are empty) when update is needed but no args", async () => {
    const userArgs = { ...args };
    userArgs.shouldUpdatePrices = true;

    const { result } = await redstoneW3f.run("onRun", { userArgs });

    checkCanNotExec(result, "Args are empty");
  });

  function checkCanNotExec(
    result: Web3FunctionResultV1 | Web3FunctionResultV2 | undefined,
    message: string
  ) {
    expect(result?.canExec).to.equal(false);
    expect(
      (
        result as {
          canExec: false;
          message: string;
        }
      ).message
    ).to.equal(message);
  }
});
