import fs from "fs";
import path from "node:path";
import * as toml from "toml";

export function readProxyContractId(contractName: string = "contract_prices") {
  const tomlData = toml.parse(
    fs.readFileSync(
      path.join(__dirname, `../../sway/${contractName}/Forc.toml`),
      "utf8"
    )
  ) as { proxy: { address: string } };

  return tomlData.proxy.address;
}
