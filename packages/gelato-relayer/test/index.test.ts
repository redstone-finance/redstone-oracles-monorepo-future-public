import hre from "hardhat";
import { expect } from "chai";
import { before } from "mocha";
import { Web3FunctionHardhat } from "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import * as args from "../web3-functions/redstone-test/userArgs.json";

import { Web3FunctionResultCallData } from "@gelatonetwork/web3-functions-sdk";

const { w3f } = hre;

describe("Redstone Gelato Relayer Tests", function () {
  this.timeout(0);

  let redstoneW3f: Web3FunctionHardhat;

  before(async function () {
    redstoneW3f = w3f.get("redstone-test");
  });

  it("Return canExec: true when update is needed", async () => {
    const userArgs: any = { ...args };
    userArgs.shouldUpdatePrices = true;
    userArgs.args = "0x0512341435321111a";

    const { result } = await redstoneW3f.run({ userArgs });
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
    const userArgs: any = { ...args };
    userArgs.shouldUpdatePrices = false;
    userArgs.message = "Update not needed";

    const { result } = await redstoneW3f.run({ userArgs });

    checkCanNotExec(result, "Update not needed");
  });

  it("Return canExec: false (Args are empty) when update is needed but no args", async () => {
    const userArgs: any = { ...args };
    userArgs.shouldUpdatePrices = true;

    const { result } = await redstoneW3f.run({ userArgs });

    checkCanNotExec(result, "Args are empty");
  });

  function checkCanNotExec(
    result:
      | { canExec: true; callData: string }
      | { canExec: false; message: string }
      | {
          canExec: true;
          callData: Web3FunctionResultCallData[];
        },
    message: string
  ) {
    expect(result.canExec).to.equal(false);
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
