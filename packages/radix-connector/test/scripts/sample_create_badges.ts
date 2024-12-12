import { RadixClient } from "../../src";
import { BadgeCreatorRadixContractConnector } from "../../src/contracts/badge_creator/BadgeCreatorRadixContractConnector";
import {
  BADGE_CREATOR_NAME,
  loadAddress,
  NETWORK,
  PRIVATE_KEY,
} from "./constants";

async function createBadges() {
  const client = new RadixClient(PRIVATE_KEY, NETWORK.id);

  const connector = new BadgeCreatorRadixContractConnector(
    client,
    await loadAddress(`package.${NETWORK.name}.addr`, BADGE_CREATOR_NAME)
  );

  await connector.createBadges();
}

void createBadges();
