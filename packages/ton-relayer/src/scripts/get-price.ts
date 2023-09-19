import { utils } from "ethers";
import { priceFeedAddresses } from "../config/price-feed-addresses";
import { ContractConnectorFactory } from "../ton/ContractConnectorFactory";

(async () => {
  for (const feedAddress of [priceFeedAddresses.BTC, priceFeedAddresses.ETH]) {
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
