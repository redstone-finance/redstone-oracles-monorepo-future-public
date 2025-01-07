import { BadgeCreatorRadixContractConnector, RadixClient } from "../src";
import {
  BADGE_CREATOR_NAME,
  loadAddress,
  NETWORK,
  PRIVATE_KEY,
} from "./constants";

async function createBadges() {
  const client = new RadixClient(NETWORK.id, PRIVATE_KEY);

  const connector = new BadgeCreatorRadixContractConnector(
    client,
    await loadAddress(`package`, BADGE_CREATOR_NAME)
  );

  await connector.createBadges();
}

void createBadges();
