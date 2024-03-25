import { CasperClient, Keys } from "casper-js-sdk";
import path from "node:path";
import axios from "axios";
import assert from "node:assert";
import { CasperConnection } from "./casper/CasperConnection";
import { CasperConfig } from "./casper/CasperConfig";

export async function makeCasperConnection(config: CasperConfig) {
  const casperClient = new CasperClient(config.nodeUrl);
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

  return new CasperConnection(casperClient, signKeyPair, networkName);
}
