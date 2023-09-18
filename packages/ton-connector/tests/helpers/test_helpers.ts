import { compile } from "@ton-community/blueprint";
import { Blockchain } from "@ton-community/sandbox";
import { TestTonNetwork } from "./TestTonNetwork";
import path from "path";
import { ContractParamsProviderMock } from "@redstone-finance/sdk";
import * as fs from "fs";

export const DATA_PACKAGE_DATA_1 =
  "4554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000248b3142440186b75caeb000000020000001";
export const DATA_PACKAGE_DATA_2 =
  "4554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000248c3218dc0186b75c87a000000020000001";
export const TON_MAX_UINT =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;

// there are 2 package timestamps in the file: 1678113540 and 1678113550
export const SAMPLE_PACKAGES_TIMESTAMP = 1678113540;
export const ETH_BIG_NUMBER = 4543560n;

export async function createTesterContractEnv(name: string) {
  const testerCode = await compile(name);
  const blockchain = await Blockchain.create();
  const deployer = await blockchain.treasury("deployer");
  const network = new TestTonNetwork(blockchain, deployer);

  return { network, testerCode };
}

export function createContractParamsProviderMock(
  dataFeeds: string[],
  filename: string = "2sig_ETH_BTC"
) {
  const filePath = path.join(__dirname, `../sample-data/${filename}.hex`);

  return new ContractParamsProviderMock(dataFeeds, filePath, fs.readFileSync);
}
