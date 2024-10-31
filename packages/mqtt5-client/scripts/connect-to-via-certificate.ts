import { Mqtt5Client } from "../src";

const CERT = `-----BEGIN CERTIFICATE-----
....
-----END CERTIFICATE-----
`;
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
....
-----END RSA PRIVATE KEY-----
`;
const ENDPOINT = "";

async function main() {
  const mqttClient = await Mqtt5Client.create({
    endpoint: ENDPOINT,
    authorization: {
      type: "Cert",
      privateKey: PRIVATE_KEY,
      cert: CERT,
    },
  });

  await mqttClient.subscribe(["#"], console.log);
}

void main();
