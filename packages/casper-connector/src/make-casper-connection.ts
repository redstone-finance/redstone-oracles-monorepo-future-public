import axios from "axios";
import { Keys } from "casper-js-sdk";
import assert from "node:assert";
import path from "node:path";
import { CasperConfig } from "./casper/CasperConfig";
import { CasperConnection } from "./casper/CasperConnection";

export async function makeCasperConnection(config: CasperConfig) {
  const folder = path.join(config.keysPath);
  const signKeyPair = Keys.Ed25519.parseKeyFiles(
    folder + `/public_key.pem`,
    folder + `/secret_key.pem`
  );

  const response = await axios.get(config.statusApi);
  if (response.status != 200) {
    throw new Error("Network status cannot be fetched");
  }

  const networkName = (response.data as { chainspec_name: string })
    .chainspec_name;
  assert(networkName === config.networkName);

  return CasperConnection.makeWithKeyPair(
    config.nodeUrl,
    config.networkName,
    signKeyPair
  );
}
