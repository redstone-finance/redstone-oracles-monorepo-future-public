import { startSimpleRelayer } from "@redstone-finance/sdk";
import { config } from "../config";
import { manifest } from "../config/manifest";
import { ContractConnectorFactory } from "../ton/ContractConnectorFactory";

// eslint-disable-next-line @typescript-eslint/no-floating-promises -- Disabled for top-level functions
startSimpleRelayer(
  {
    updatePriceInterval:
      manifest.updateTriggers.timeSinceLastUpdateInMilliseconds,
    ...config,
  },
  ContractConnectorFactory.makePriceManagerContractConnector(
    manifest.adapterContract
  )
);
