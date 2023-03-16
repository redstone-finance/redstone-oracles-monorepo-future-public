import { Contract, providers, utils } from "ethers";
import { abi } from "../../artifacts/contracts/price-feeds/PriceFeed.sol/PriceFeed.json";

const RPC_URL =
  "https://api-insti-1-testnet-us-west-2.avax-test.network/ext/bc/Ue98aQ3AoP1EqH8LwX496W6h1d8hUHNHG7AFGvRe4PSJVkQw1/rpc";
const CHAIN_NAME = "Insti 1";
const CHAIN_ID = 424242;
const SONIA_PRICE_FEED_ADDRESS = "0x2cC2183DaB057569Aa6cad5540F6D3dfD1FDF42e";
const SOFR_PRICE_FEED_ADDRESS = "0x2343e7528767826B547122cC43374e56d5efC755";

(async () => {
  const provider = new providers.StaticJsonRpcProvider(RPC_URL, {
    name: CHAIN_NAME,
    chainId: CHAIN_ID,
  });
  const soniaPriceFeedContract = new Contract(
    SONIA_PRICE_FEED_ADDRESS,
    abi,
    provider
  );
  const sofrPriceFeedContract = new Contract(
    SOFR_PRICE_FEED_ADDRESS,
    abi,
    provider
  );
  const soniaLatestRoundData = await soniaPriceFeedContract.latestRoundData();
  const sofrLatestRoundData = await sofrPriceFeedContract.latestRoundData();
  const soniaValue = utils.formatUnits(soniaLatestRoundData.answer, 8);
  const sofrValue = utils.formatUnits(sofrLatestRoundData.answer, 8);
  console.log(JSON.stringify({ SONIA: soniaValue, SOFR: sofrValue }, null, 2));
})();
