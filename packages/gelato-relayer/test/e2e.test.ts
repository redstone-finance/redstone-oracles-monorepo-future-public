import hre from "hardhat";
import { expect } from "chai";
import { before } from "mocha";
import { Web3FunctionHardhat } from "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import * as args from "./userArgs.json";

import { Web3FunctionResultCallData } from "@gelatonetwork/web3-functions-sdk";

const { w3f } = hre;

describe("RedStone Gelato w3f: On-chain Relayer & remote manifest e2e Tests", function () {
  this.timeout(0);

  let redstoneW3f: Web3FunctionHardhat;

  before(async function () {
    redstoneW3f = w3f.get("redstone");
  });

  /// TODO: Temporary disabled - will be re-enabled after manifest's upgrade on the main branch
  it.skip("Return canExec: true when update is needed", async () => {
    const userArgs: any = { ...args };
    const { result } = await redstoneW3f.run({ userArgs });
    expect(result.canExec).to.equal(true);

    const callData = (
      result as {
        canExec: true;
        callData: Web3FunctionResultCallData[];
      }
    ).callData;

    expect(callData.length).to.equal(1);
    expect(callData[0].to).to.equal(
      "0x37D7B138e9545af5D944009E94D56A5398EC7CE4"
    );
  });
});
