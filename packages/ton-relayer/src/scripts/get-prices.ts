import { utils } from "ethers";
import { manifest } from "../config/manifest";
import { ContractConnectorFactory } from "../ton/ContractConnectorFactory";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  for (const [_, feedAddress] of Object.entries(manifest.priceFeeds)) {
    try {
      const connector =
        ContractConnectorFactory.makePriceFeedContractConnector(feedAddress);
      const adapter = await connector.getAdapter();

      await adapter.fetchRoundData();
      await connector.waitForTransaction("");

      const latestRoundData = await adapter.readLatestRoundData();

      const price = utils.formatUnits(Number(latestRoundData.answer), 8);

      console.log(price);
    } catch (e) {
      console.error(e);
    }
  }
})();
