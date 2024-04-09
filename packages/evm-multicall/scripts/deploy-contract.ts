import assert from "assert";
import { ethers } from "ethers";
import * as hre from "hardhat";

async function deployRedstoneMulticall() {
  const privKey = process.env["PRIVATE_KEY"];
  assert.ok(privKey, "env PRIVATE_KEY has to be defined");

  const wallet = new ethers.Wallet(privKey).connect(hre.ethers.provider);

  console.log("deploy start");
  const deployed = await hre.ethers.deployContract(
    "RedstoneMulticall3",
    wallet
  );

  console.log(`address=${deployed.address}`);

  console.log(`deploy_tx=${JSON.stringify(deployed.deployTransaction)}`);
}

void deployRedstoneMulticall();
