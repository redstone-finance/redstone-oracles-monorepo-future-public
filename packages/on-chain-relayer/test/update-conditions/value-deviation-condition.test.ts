import { ValuesForDataFeeds } from "@redstone-finance/sdk";
import { expect } from "chai";
import { RelayerConfig } from "../../src";
import { checkValueDeviationCondition } from "../../src/core/update-conditions/check-value-deviation-condition";
import {
  createNumberFromContract,
  getDataPackagesResponse,
  mockConfig,
} from "../helpers";

describe("check-value-deviation-condition", () => {
  let relayerConfig: RelayerConfig;

  before(() => {
    relayerConfig = mockConfig();
  });

  it("should return false if value diff smaller than expected", async () => {
    const dataPackages = await getDataPackagesResponse();
    const smallerValueDiff: ValuesForDataFeeds = {
      ETH: createNumberFromContract(1630.99),
      BTC: createNumberFromContract(23011.68),
    };
    let { shouldUpdatePrices, warningMessage } = checkValueDeviationCondition(
      "ETH",
      dataPackages,
      smallerValueDiff.ETH!,
      relayerConfig
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Value has not deviated enough to be updated/
    );
    expect(warningMessage).not.to.match(/Deviation in fallback mode:/);
    ({ shouldUpdatePrices, warningMessage } = checkValueDeviationCondition(
      "BTC",
      dataPackages,
      smallerValueDiff.BTC!,
      relayerConfig
    ));
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Value has not deviated enough to be updated/
    );
    expect(warningMessage).not.to.match(/Deviation in fallback mode:/);
  });

  it("should return true if value diff bigger than expected", async () => {
    const dataPackages = await getDataPackagesResponse();
    const biggerValueDiff: ValuesForDataFeeds = {
      ETH: createNumberFromContract(1230.99),
      BTC: createNumberFromContract(13011.68),
    };
    let { shouldUpdatePrices, warningMessage } = checkValueDeviationCondition(
      "ETH",
      dataPackages,
      biggerValueDiff.ETH!,
      relayerConfig
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.match(/Value has deviated enough to be/);
    expect(warningMessage).not.to.match(/Deviation in fallback mode:/);
    ({ shouldUpdatePrices, warningMessage } = checkValueDeviationCondition(
      "BTC",
      dataPackages,
      biggerValueDiff.BTC!,
      relayerConfig
    ));
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.match(/Value has deviated enough to be/);
    expect(warningMessage).not.to.match(/Deviation in fallback mode:/);
  });

  // it("should return true if value diff bigger than expected - medium packages", async () => {
  //   const dataPackages = await getMultiPointDataPackagesResponse("ETH/BTC");
  //   const biggerValueDiff: ValuesForDataFeeds = {
  //     ETH: createNumberFromContract(1230.99),
  //     BTC: createNumberFromContract(13011.68),
  //   };
  //   const { shouldUpdatePrices, warningMessage } = checkValueDeviationCondition(
  //     dataPackages,
  //     biggerValueDiff,
  //     relayerConfig
  //   );
  //   expect(shouldUpdatePrices).to.be.true;
  //   expect(warningMessage).to.match(/Value has deviated enough to be/);
  //   expect(warningMessage).not.to.match(/Deviation in fallback mode:/);
  // });
});
