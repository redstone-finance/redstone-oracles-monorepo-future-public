import { time } from "@nomicfoundation/hardhat-network-helpers";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { BigNumber, Wallet } from "ethers";
import { ethers } from "hardhat";
import { MockCappedPriceFeed } from "../../../../typechain-types";
chai.use(chaiAsPromised);

const PARAM_SETTER = new Wallet(
  "0x66cd9afa0bdc2059df83b34359cb8eba965a3bf1b6460683572ac725aed51098"
);

const YEAR_IN_SECONDS = 3600 * 24 * 365;

// assuming PERCENTAGE_FACTOR=1e4
const fromPercent = (percent: number) => percent * 1e2;

const createContract = async () => {
  const contract = (await ethers.deployContract(
    "MockCappedPriceFeed"
  )) as MockCappedPriceFeed;
  return contract;
};

const getMarketPriceFeed = async (contract: MockCappedPriceFeed) => {
  return await ethers.getContractAt(
    "MockMarketPriceFeed",
    await contract.getMarketPriceFeed()
  );
};

const initContract = async (
  contract: MockCappedPriceFeed,
  maxYearlyRatioGrowthPercent: number,
  maxMarketDeviationPercent: number
) => {
  await contract
    .connect(PARAM_SETTER.connect(contract.provider))
    .setCapParameters(maxYearlyRatioGrowthPercent, maxMarketDeviationPercent);
};

const createAndInitContract = async (
  maxYearlyRatioGrowthPercent: number = 1e2, // 1%
  maxMarketDeviationPercent: number = 10e2 // 10%
) => {
  const contract = await createContract();
  await initContract(
    contract,
    maxYearlyRatioGrowthPercent,
    maxMarketDeviationPercent
  );
  return contract;
};

describe("CappedPriceFeed", () => {
  before(async () => {
    const [signer] = await ethers.getSigners();
    await signer.sendTransaction({
      to: PARAM_SETTER.address,
      value: BigNumber.from("1000000000000000000"), // 1eth
    });
  });

  describe("initiation", () => {
    it("can NOT call snapshot before init", async () => {
      const contract = await createContract();
      await expect(contract.snapshotRatio()).revertedWith(
        "MustInitCapParameters"
      );
    });

    it("should fail to set cap parameters with too big value", async () => {
      const contract = await createAndInitContract();
      await expect(
        contract
          .connect(PARAM_SETTER.connect(contract.provider))
          .setCapParameters(fromPercent(500), fromPercent(500 + 1))
      ).to.revertedWith("PercentValueOutOfRange");
    });

    it("should fail to set cap parameters with too small value", async () => {
      const contract = await createAndInitContract();
      await expect(
        contract
          .connect(PARAM_SETTER.connect(contract.provider))
          .setCapParameters(0, 0)
      ).to.revertedWith("PercentValueOutOfRange");
    });

    it("should transfer ownership authorized by current owner", async () => {
      const contract = await createAndInitContract();
      const [_, newOwner] = await ethers.getSigners();
      await contract
        .connect(PARAM_SETTER.connect(contract.provider))
        .transferParamSetterRole(newOwner.address);

      // new owner is capable of setting cap parameters
      await contract.connect(newOwner).setCapParameters(1, 1);
    });

    it("should FAIL to transfer ownership NOT authorized by current owner", async () => {
      const contract = await createAndInitContract();
      const [_, newOwner] = await ethers.getSigners();
      await expect(
        contract.transferParamSetterRole(newOwner.address)
      ).revertedWith("CallerIsNotParamSetter");
    });

    it("should FAIL to transfer ownership to 0 address ", async () => {
      const contract = await createAndInitContract();
      await expect(
        contract
          .connect(PARAM_SETTER.connect(contract.provider))
          .transferParamSetterRole("0x" + "0".repeat(40))
      ).revertedWith("CanNotTransferRoleToZeroAddress");
    });

    it("should allow to set params to new values", async () => {
      const contract = await createAndInitContract();
      await contract
        .connect(PARAM_SETTER.connect(contract.provider))
        .setCapParameters(1e4, 1e4);
    });

    it("should FAIL to set cap parameters, from unauthorized address", async () => {
      const contract = await createAndInitContract();
      await expect(contract.setCapParameters(1e4, 1e4)).to.revertedWith(
        "CallerIsNotParamSetter"
      );
    });
  });

  describe("max cap calculation", () => {
    it("should fail to getMaxRatio before setCapParameters was called", async () => {
      const contract = await createContract();

      await expect(contract.getMaxRatio()).to.revertedWith(
        "MustInitCapParameters"
      );
    });

    const testCases = [
      {
        annualGrowth: fromPercent(10),
        timePassed: YEAR_IN_SECONDS,
        expectedMaxRatio: (1.1e18).toString(),
      },
      {
        annualGrowth: fromPercent(10),
        timePassed: 10 * YEAR_IN_SECONDS,
        expectedMaxRatio: (2e18).toString(),
      },
      {
        annualGrowth: fromPercent(0.1),
        timePassed: YEAR_IN_SECONDS,
        expectedMaxRatio: (1.001e18).toString(),
      },
      {
        annualGrowth: fromPercent(0.1),
        timePassed: YEAR_IN_SECONDS,
        expectedMaxRatio: (1.001e18).toString(),
      },
      {
        annualGrowth: fromPercent(0.1),
        timePassed: (YEAR_IN_SECONDS / 365) * 5, // days
        expectedMaxRatio: "1000013698630136986",
      },
      {
        annualGrowth: fromPercent(0.01),
        timePassed: 1,
        expectedMaxRatio: "1000000000003170979",
      },
      {
        // testing for max overflows
        annualGrowth: fromPercent(500),
        timePassed: YEAR_IN_SECONDS * 1000,
        expectedMaxRatio: "5001000000000000000000",
      },
    ];

    for (const test of testCases) {
      it(`annualGrowth=${test.annualGrowth} timePassedSeconds=${test.timePassed} => maxRatio=${test.expectedMaxRatio}`, async () => {
        const contract = await createAndInitContract(test.annualGrowth);
        await time.increase(test.timePassed);
        expect(await contract.getMaxRatio()).to.eq(test.expectedMaxRatio);
      });
    }
  });

  describe("latestAnswer and latestRoundData capped to max", () => {
    it("should return maxRatio when fundamental ratio is bigger then maxRatio", async () => {
      const cappedPriceFeed = await createAndInitContract();
      const startTimestamp = await time.latest();

      // bigger then max ratio
      await cappedPriceFeed.setFundementalRatio((2e18).toString());
      await time.increaseTo(startTimestamp + YEAR_IN_SECONDS);

      const expectedAnswer = (1.01e18).toString();
      const answer = await cappedPriceFeed.latestAnswer();
      expect(answer).to.eq(expectedAnswer);
    });

    it("should return ratio when maxRatio is smaller then maxRatio", async () => {
      const cappedPriceFeed = await createAndInitContract();
      const startTimestamp = await time.latest();

      // smaller then max ratio
      await cappedPriceFeed.setFundementalRatio((1e17).toString());
      await time.increaseTo(startTimestamp + YEAR_IN_SECONDS);

      const expectedAnswer = (1e17).toString();
      const answer = await cappedPriceFeed.latestAnswer();
      expect(answer).to.eq(expectedAnswer);
    });
  });

  describe("market price deviation", () => {
    const testCases = [
      {
        marketRatio: (2e18).toString(),
        fundamentalRatio: (2e18).toString(),
        deviation: "0",
      },
      {
        marketRatio: (1e18).toString(),
        fundamentalRatio: (2e18).toString(),
        deviation: fromPercent(100).toString(),
      },
      {
        marketRatio: (2e18).toString(),
        fundamentalRatio: (1e18).toString(),
        deviation: fromPercent(-50).toString(),
      },
      {
        marketRatio: (1e18).toString(),
        fundamentalRatio: (1.0001e18).toString(),
        deviation: fromPercent(0.01).toString(),
      },
      {
        marketRatio: (1).toString(),
        fundamentalRatio: (1e8).toString(),
        deviation: fromPercent(9999999900).toString(),
      },
    ];

    for (const test of testCases) {
      it(`marketRatio=${test.marketRatio} fundamentalRatio=${test.fundamentalRatio} => deviation=${test.deviation} `, async () => {
        const cappedPriceFeed = await createAndInitContract();
        const marketPriceFeed = await getMarketPriceFeed(cappedPriceFeed);

        await marketPriceFeed.setAnswer(test.marketRatio);
        await cappedPriceFeed.setFundementalRatio(test.fundamentalRatio);
        expect(
          await cappedPriceFeed.getFundamentalRatioDeviationFromMarketRatio()
        ).to.eq(test.deviation);
      });
    }

    it("should return false when maxMarketDeviationPercent is crossed", async () => {
      const cappedPriceFeed = await createAndInitContract(
        fromPercent(10),
        fromPercent(49)
      );
      const marketPriceFeed = await getMarketPriceFeed(cappedPriceFeed);

      await marketPriceFeed.setAnswer(2);
      await cappedPriceFeed.setFundementalRatio(1);
      expect(
        await cappedPriceFeed.getFundamentalRatioDeviationFromMarketRatio()
      ).to.eq(fromPercent(-50));

      expect(
        await cappedPriceFeed.isFundamentalRatioCloseToMarketRatio()
      ).to.eq(false);

      await expect(
        cappedPriceFeed.latestAnswerIfRatioCloseToMarktetRatio()
      ).to.revertedWith("FundametnalRatioDivergedFromMarketRatio");
    });

    it("should return true when maxMarketDeviationPercent is NOT crossed", async () => {
      const cappedPriceFeed = await createAndInitContract(
        fromPercent(10),
        fromPercent(49)
      );
      const marketPriceFeed = await getMarketPriceFeed(cappedPriceFeed);

      await marketPriceFeed.setAnswer(3);
      await cappedPriceFeed.setFundementalRatio(2);
      expect(
        await cappedPriceFeed.getFundamentalRatioDeviationFromMarketRatio()
      ).to.eq(-3333);

      expect(
        await cappedPriceFeed.isFundamentalRatioCloseToMarketRatio()
      ).to.eq(true);
    });
  });

  describe("snapshots", () => {
    it("snapshot should revert when fundamental exceeds getMaxRatio", async () => {
      const ANNUAL_GROWTH = fromPercent(10);
      const contract = await createAndInitContract(ANNUAL_GROWTH);
      await time.increase(YEAR_IN_SECONDS);

      await contract.setFundementalRatio((1.11e18).toString());

      await expect(contract.snapshotRatio()).revertedWith(
        "FundamentalRatioCantExceedMaxRatio"
      );
    });

    it("snapshot works when fundamental ratio increases", async () => {
      const ANNUAL_GROWTH = fromPercent(10);
      const contract = await createAndInitContract(ANNUAL_GROWTH);
      await time.increase(YEAR_IN_SECONDS);
      expect(await contract.getMaxRatio()).to.eq((1.1e18).toString());

      await contract.setFundementalRatio((1.1e18).toString());

      await contract.snapshotRatio();
      await time.increase(YEAR_IN_SECONDS);
      expect(await contract.getMaxRatio()).to.eq((1.21e18).toString());
    });

    it("snapshot works when fundamental ratio decreases", async () => {
      const ANNUAL_GROWTH = fromPercent(10);
      const contract = await createAndInitContract(ANNUAL_GROWTH);
      await time.increase(YEAR_IN_SECONDS);
      expect(await contract.getMaxRatio()).to.eq((1.1e18).toString());

      await contract.setFundementalRatio((0.5e18).toString());

      await contract.snapshotRatio();
      await time.increase(YEAR_IN_SECONDS);
      expect(await contract.getMaxRatio()).to.eq((0.55e18).toString());
    });

    it("snapshot reverts when fundamental ratio is 0", async () => {
      const ANNUAL_GROWTH = fromPercent(10);
      const contract = await createAndInitContract(ANNUAL_GROWTH);

      await contract.setFundementalRatio(0);

      await time.increase(61);

      await expect(contract.snapshotRatio()).revertedWith(
        "FundamentalRatioEqualsZero"
      );
    });

    it("snapshot reverts when it was updated recently", async () => {
      const ANNUAL_GROWTH = fromPercent(10);
      const contract = await createAndInitContract(ANNUAL_GROWTH);

      await expect(contract.snapshotRatio()).revertedWith(
        "SnapshotCanBeUpdatedOnlyEveryOneMinute"
      );
    });

    it("should update cap parameters", async () => {
      const ANNUAL_GROWTH = fromPercent(10);
      const contract = await createAndInitContract(ANNUAL_GROWTH);

      await contract
        .connect(PARAM_SETTER.connect(contract.provider))
        .setCapParameters(fromPercent(5), fromPercent(50));

      await time.increase(YEAR_IN_SECONDS);

      expect(await contract.getMaxRatio()).to.eq((1.05e18).toString());
    });

    it("should get snapshot fundamental ratio, when fundamentalRatio() returns 0", async () => {
      const ANNUAL_GROWTH = fromPercent(10);
      const contract = await createAndInitContract(ANNUAL_GROWTH);

      await contract.setFundementalRatio(0);

      await time.increase(61);

      expect(await contract.getRatio()).to.eq((1e18).toString());
    });

    it("properly snapshots value bigger then 200 bits => 2 ^ 220", async () => {
      const ANNUAL_GROWTH = fromPercent(10);

      const contract = await createContract();
      await contract.setFundementalRatio(
        BigNumber.from(
          "1684996666696914987166688442938726917102321526408785780068975640576" // 2 ^ 220
        )
      );
      await initContract(contract, ANNUAL_GROWTH, ANNUAL_GROWTH);

      const lastBlockTimestamp = await time.latest();
      expect(await contract.getSnapshot()).to.deep.eq([
        BigNumber.from(
          "1684996666696914987166688442938726917102321526408785780068975640576"
        ),
        lastBlockTimestamp,
      ]);
    });

    it("properly snapshots value bigger then 200 bits => 2 ^ 200", async () => {
      const ANNUAL_GROWTH = fromPercent(10);

      const contract = await createContract();
      await contract.setFundementalRatio(
        BigNumber.from(
          "1606938044258990275541962092341162602522202993782792835301376" // 2 ^ 220
        )
      );
      await initContract(contract, ANNUAL_GROWTH, ANNUAL_GROWTH);

      const lastBlockTimestamp = await time.latest();
      expect(await contract.getSnapshot()).to.deep.eq([
        BigNumber.from(
          "1606938044258990275541962092341162602522202993782792835301376"
        ),
        lastBlockTimestamp,
      ]);
    });
  });
});
