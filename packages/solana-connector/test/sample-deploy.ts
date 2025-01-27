import { RedstoneCommon } from "@redstone-finance/utils";
import { execSync } from "child_process";
import dotenv from "dotenv";
import { setTimeout } from "timers/promises";

function deploy() {
  const cluster = RedstoneCommon.getFromEnv("CLUSTER");

  const deployCmd = `cd solana && anchor deploy --provider.cluster ${cluster}`;

  execSync(deployCmd, { stdio: ["inherit", "inherit", "inherit"] });
}

async function main() {
  dotenv.config();

  deploy();
  await setTimeout(15_000); // wait 15 secodns before continuing
}

void main();
