import { RedstoneCommon } from "@redstone-finance/utils";
import { ProxyRadixContractDeployer, RadixClient } from "../src";
import { NonFungibleGlobalIdInput } from "../src/radix/utils";
import {
  FEED_ID,
  loadAddress,
  NETWORK,
  PRICE_FEED_NAME,
  PRIVATE_KEY,
  PROXY_NAME,
  saveAddress,
} from "./constants";

const OWNER_BADGE: () => NonFungibleGlobalIdInput = () => ({
  resourceAddress: RedstoneCommon.getFromEnv("OWNER_BADGE_RESOURCE_ADDRESS"),
  localId: RedstoneCommon.getFromEnv("OWNER_BADGE_LOCAL_ID"),
});

const MAN_BADGE: () => NonFungibleGlobalIdInput = () => ({
  resourceAddress: RedstoneCommon.getFromEnv("MAN_BADGE_RESOURCE_ADDRESS"),
  localId: RedstoneCommon.getFromEnv("MAN_BADGE_LOCAL_ID"),
});

async function instantiate() {
  const client = new RadixClient(PRIVATE_KEY, NETWORK.id);

  const connector = new ProxyRadixContractDeployer(
    client,
    await loadAddress(`package`, PROXY_NAME),
    OWNER_BADGE(),
    MAN_BADGE(),
    await loadAddress(`component`, PRICE_FEED_NAME, FEED_ID)
  );

  const componentId = await connector.getComponentId();
  console.log(componentId);

  await saveAddress(`component`, PROXY_NAME, componentId, FEED_ID);
}

void instantiate();
