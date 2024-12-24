import { RedstoneCommon } from "@redstone-finance/utils";
import { ProxyRadixContractConnector, RadixClient } from "../src";
import { NonFungibleGlobalIdInput } from "../src/radix/utils";
import {
  FEED_ID,
  loadAddress,
  NETWORK,
  PRICE_FEED_NAME,
  PRIVATE_KEY,
  PROXY_NAME,
} from "./constants";

const MAN_BADGE: () => NonFungibleGlobalIdInput = () => ({
  resourceAddress: RedstoneCommon.getFromEnv("MAN_BADGE_RESOURCE_ADDRESS"),
  localId: RedstoneCommon.getFromEnv("MAN_BADGE_LOCAL_ID"),
});

async function changeProxyAddress() {
  const client = new RadixClient(PRIVATE_KEY, NETWORK.id);

  const connector = new ProxyRadixContractConnector(
    client,
    await loadAddress(`component`, PROXY_NAME, FEED_ID)
  );

  const adapter = await connector.getAdapter();
  await adapter.setContractGlobalAddress(
    await loadAddress(`component`, PRICE_FEED_NAME, FEED_ID),
    MAN_BADGE()
  );
}

void changeProxyAddress();
