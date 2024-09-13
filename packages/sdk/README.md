# RedStone JS SDK

Typescript/Javascript SDK for interacting with the RedStone ecosystem. Below a couple of basic use cases.

## Fetch data packages

The most common use case is to fetch data packages for off-chain consumption. If you want to consume RedStone data packages on-chain consider using @redstone-finance/evm-connector library.

We provide a single method that can be used to fetch and validate packages

```typescript
import { requestDataPackages } from "@redstone-finance/sdk";

// fetch data packages from RedStone DDL based on provided fetch configuration.
const dataPackages = await requestDataPackages({
  // for production environment most of the time "redstone-primary-prod" is appropriate
  dataServiceId: "redstone-primary-prod",
  // array of tokens to fetch
  dataPackagesIds: ["BTC", "ETH"],
  // ensure minimum number of signers for each token
  // - 'uniqueSignersCount' packages closest to median of all fetched packages are returned
  // - throws if there are less signers for any token
  uniqueSignersCount: 2,
  // (optional, default: 500) wait for responses from all the gateways for this time, then wait for at least one response and return the newest fetched packages (does not apply if 'historicalTimestamp' is provided)
  waitForAllGatewaysTimeMs: 1000,
  // (optional, default: no filter) filter out old packages
  maxTimestampDeviationMS: 60 * 1000,
  // (optional, default: no filter) accept packages only from specific signers, by default signatures are not verified. RedStone gateway won't return packages not signed by RedStone nodes, but you may still want to use this filter if you use your own gateway or want higher level of security (e.g. stay immune to man-in-the-middle attacks)
  authorizedSigners: ["0x00000000000000000000000000000001"],
  // (optional, default: public gateways) fetch from specific gateways, if not provided fetch from all publicly available gateways
  urls: ["https://my-private-gateway1", "https://my-private-gateway2"],
  // (optional, default fetch latest data) fetch packages from specific moment (unix timestamp in milliseconds), most of the time this value should be multiple of 10000 (10 sec)
  // in this mode first response is returned to the user
  historicalTimestamp: 1726124100000,
  // (optional, default: false) do not throw error in case of missing or filtered-out token
  ignoreMissingFeed: true,
});
```

## Validate package signature

In the case when you want to verify package signature on your own it you can use the following code snippet

```typescript
import { recoverSignerAddress } from "@redstone-finance/protocol";
import { getOracleRegistryState, getSignersForDataServiceId } from "@redstone-finance/sdk";

// well-known RedStone primary node addresses
// you can pass this list to requestDataPackages method above to perform validation automatically
const oracleRegistry = await getOracleRegistryState();
const redstonePrimaryNodesAddresses = getSignersForDataServiceId(oracleRegistry, "redstone-primary-prod");

const signerAddress = recoverSignerAddress(dataPackage);
if (redstonePrimaryNodesAddresses.includes(signerAddress)) {
  // package is signed by RedStone primary node
} else {
  // package is corrupted or not signed by RedStone primary node
}
```

## Verify that data package was signed by RedStone

If you recovered signer address of the package you can verify if it is RedStone address.

```typescript
import { getDataServiceIdForSigner } from "@redstone-finance/sdk";

let dataServiceId: string;
try {
  const oracleRegistry = await getOracleRegistryState();
  dataServiceId = getDataServiceIdForSigner(oracleRegistry, address);
} catch (e) {
  // address not known to RedStone, be cautious
}
```
