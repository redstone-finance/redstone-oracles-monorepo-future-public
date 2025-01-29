import { Transaction, UpgradePolicy } from "@mysten/sui/transactions";
import { execSync } from "node:child_process";
import {
  DEFAULT_GAS_BUDGET,
  getDeployDir,
  readIds,
  SuiNetworkName,
} from "../../src";
import { generateTransactionData } from "./generate-transaction-data";

const BUILD_CMD = `sui move build --force --dump-bytecode-as-base64 --ignore-chain`;

export function setUpUpgradeTx(tx: Transaction, network: SuiNetworkName) {
  const packagePath = getDeployDir();
  const { modules, dependencies, digest } = JSON.parse(
    execSync(`${BUILD_CMD} --path ${packagePath}`, {
      encoding: "utf8",
    })
  ) as { modules: string[]; dependencies: string[]; digest: number[] };

  const ids = readIds(network);
  tx.setGasBudget(10n * DEFAULT_GAS_BUDGET);
  const ticket = tx.moveCall({
    target: "0x2::package::authorize_upgrade",
    arguments: [
      tx.object(ids.upgradeCapId),
      tx.pure.u8(UpgradePolicy.COMPATIBLE),
      tx.pure.vector("u8", digest),
    ],
  });

  const upgrade = tx.upgrade({
    modules,
    dependencies,
    package: ids.packageId,
    ticket,
  });

  tx.moveCall({
    target: "0x2::package::commit_upgrade",
    arguments: [tx.object(ids.upgradeCapId), upgrade],
  });
}

void generateTransactionData(setUpUpgradeTx);
