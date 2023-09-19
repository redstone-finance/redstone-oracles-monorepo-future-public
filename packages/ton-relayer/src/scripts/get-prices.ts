import { utils } from "ethers";
import { ContractConnectorFactory } from "../ton/ContractConnectorFactory";
import { manifest } from "../config/manifest";

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
