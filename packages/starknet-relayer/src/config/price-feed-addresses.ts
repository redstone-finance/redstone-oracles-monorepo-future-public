import { VERSION } from "./index";

export const priceFeedAddresses: {
  [key in VERSION]: { BTC: string; ETH: string };
} = {
  "0": {
    BTC: "0x0712a25055cf4fcd1616f79540aa82c5d947f55e06ea2c6ca8fe9fcf97eb5c8b",
    ETH: "0x03a51e049f6f51382d6bef8f77179f8d1b907818e8c485905e1a90f7eac0754c",
  },
};
