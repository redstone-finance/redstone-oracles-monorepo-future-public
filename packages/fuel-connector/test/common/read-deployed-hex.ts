import fs from "fs";
import path from "node:path";

export function readDeployedHex(contractName: string = "contract") {
  return fs
    .readFileSync(
      path.join(__dirname, `../../sway/${contractName}/CONTRACT_ID`),
      "utf8"
    )
    .trim();
}
