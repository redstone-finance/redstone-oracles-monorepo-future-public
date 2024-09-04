import { time } from "@nomicfoundation/hardhat-network-helpers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { MockSignerAddress } from "@redstone-finance/evm-connector/src/helpers/test-utils";
import { DataPackage, DataPoint, utils } from "@redstone-finance/protocol";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { MultiFeedAdapterWithoutRoundsMock } from "../../../../typechain-types";

chai.use(chaiAsPromised);

const authorisedSignersForTests: MockSignerAddress[] = [
  "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
];

export const describeCommonMultiFeedAdapterTests = (contractName: string) => {
  describe("Common multi price feed adapter tests", () => {
    let multiAdapter: MultiFeedAdapterWithoutRoundsMock;

    const pauseAutomining = async () => {
      await network.provider.send("evm_setAutomine", [false]);
    };

    const resumeAutomining = async () => {
      await network.provider.send("evm_setAutomine", [true]);
      await network.provider.send("evm_mine");
    };

    const updatePrices = async (opts: {
      prices: Record<string, string>;
      prepareDataTime?: (blockTime: number) => number;
      dataFeedIdsStrings?: string[];
      signerAddresses?: MockSignerAddress[];
    }) => {
      const prevBlockTime = await time.latest();
      const curBlockTime = prevBlockTime + 10;
      const mockDataTimestamp = opts.prepareDataTime
        ? opts.prepareDataTime(prevBlockTime)
        : prevBlockTime * 1000;
      await time.setNextBlockTimestamp(curBlockTime);

      const dataPoints = Object.entries(opts.prices).map(
        ([dataFeedId, value]) => {
          return new DataPoint(
            dataFeedId,
            utils.convertNumberToBytes(value, 0, 32)
          );
        }
      );
      const dataPackage = new DataPackage(
        dataPoints,
        mockDataTimestamp,
        "__MOCK__"
      );
      const wrappedAdapter = WrapperBuilder.wrap(
        multiAdapter
      ).usingMockDataPackages(
        (opts.signerAddresses ?? authorisedSignersForTests).map((signer) => ({
          signer,
          dataPackage,
        }))
      );

      const dataFeedIds = (
        opts.dataFeedIdsStrings ?? Object.keys(opts.prices)
      ).map(formatBytes32String);

      return await wrappedAdapter.updateDataFeedsValuesPartial(dataFeedIds);
    };

    const expectPrice = async (dataFeedId: string, expectedValue: string) => {
      const valueFromContract = await multiAdapter.getValueForDataFeed(
        formatBytes32String(dataFeedId)
      );
      expect(valueFromContract.toString()).to.eq(expectedValue);
    };

    beforeEach(async () => {
      const contractFactory = await ethers.getContractFactory(contractName);
      multiAdapter =
        (await contractFactory.deploy()) as MultiFeedAdapterWithoutRoundsMock;
      await multiAdapter.deployed();
    });

    it("should update 1 value", async () => {
      await updatePrices({ prices: { ETH: "42" } });
      await expectPrice("ETH", "42");
    });

    it("should update 2 values", async () => {
      await updatePrices({ prices: { ETH: "42", BTC: "4242" } });
      await expectPrice("ETH", "42");
      await expectPrice("BTC", "4242");
    });

    it("Should get details of the latest update for many feeds", async () => {
      await updatePrices({ prices: { ETH: "42", BTC: "4242" } });
      // This function will be used by multi-feed relayer
      const lastUpdateDetails =
        await multiAdapter.getLastUpdateDetailsUnsafeForMany(
          ["BTC", "MISSING_ID", "ETH"].map(formatBytes32String)
        );
      expect(lastUpdateDetails[0].value).to.eq("4242");
      expect(lastUpdateDetails[0].blockTimestamp).to.not.eq("0");
      expect(lastUpdateDetails[1].value).to.eq("0");
      expect(lastUpdateDetails[1].blockTimestamp).to.eq("0");
      expect(lastUpdateDetails[2].value).to.eq("42");
    });

    it("should update different subsets of values", async () => {
      await updatePrices({ prices: { ETH: "42", BTC: "4242" } });
      await expectPrice("ETH", "42");
      await expectPrice("BTC", "4242");

      await updatePrices({ prices: { ETH: "43" } });
      await expectPrice("ETH", "43");
      await expectPrice("BTC", "4242");

      await updatePrices({ prices: { ETH: "44", BTC: "5000", USDC: "1234" } });
      await expectPrice("ETH", "44");
      await expectPrice("BTC", "5000");
      await expectPrice("USDC", "1234");
    });

    it("should revert when trying to get details of feed that wasn't updated yet", async () => {
      await expect(
        multiAdapter.getLastUpdateDetails(formatBytes32String("ETH"))
      ).to.be.revertedWith("InvalidLastUpdateDetails");
    });

    it("should revert if redstone payload is not attached", async () => {
      await expect(
        multiAdapter.updateDataFeedsValuesPartial([formatBytes32String("ETH")])
      ).to.be.revertedWith("CalldataMustHaveValidPayload");
    });

    it("should revert for an unauthorised signer", async () => {
      await expect(
        updatePrices({
          prices: { ETH: "43" },
          signerAddresses: [
            ...authorisedSignersForTests,
            "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", // Unauthorised signer address
          ],
        })
      ).to.be.revertedWith("SignerNotAuthorised");
    });

    it("should revert for too few signers", async () => {
      await expect(
        updatePrices({
          prices: { ETH: "43" },
          signerAddresses: ["0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"],
        })
      ).to.be.revertedWith("InsufficientNumberOfUniqueSigners");
    });

    it("should properly update data feeds with extra data feeds in payload", async () => {
      await updatePrices({
        prices: { ETH: "43", USDC: "1234", BTC: "5000" },
        dataFeedIdsStrings: ["ETH", "USDC"],
      });
      await expectPrice("ETH", "43");
      await expectPrice("USDC", "1234");

      // BTC value should have not been updated
      await expect(
        multiAdapter.getValueForDataFeed(formatBytes32String("BTC"))
      ).to.be.revertedWith("InvalidLastUpdateDetails");
    });

    it("should revert trying to update with duplicated feeds in an array", async () => {
      await expect(
        updatePrices({
          prices: { ETH: "43", USDC: "5000" },
          dataFeedIdsStrings: ["ETH", "USDC", "ETH"],
        })
      ).to.be.revertedWith("InsufficientNumberOfUniqueSigners");
    });

    it("should revert trying to update a missing feed", async () => {
      await expect(
        updatePrices({
          prices: { ETH: "43", USDC: "5000" },
          dataFeedIdsStrings: ["ETH", "BTC", "USDC"],
        })
      ).to.be.revertedWith("InsufficientNumberOfUniqueSigners");
    });

    it("should revert trying to get a zero value for a data feed", async () => {
      await expect(
        multiAdapter.getValueForDataFeed(formatBytes32String("ETH"))
      ).to.be.revertedWith("InvalidLastUpdateDetails");
    });

    it("should properly get several values", async () => {
      await updatePrices({ prices: { ETH: "44", BTC: "5000", USDC: "1234" } });
      const values = await multiAdapter.getValuesForDataFeeds(
        ["BTC", "ETH"].map(formatBytes32String)
      );
      expect(values.map((val) => val.toString())).to.deep.equal(["5000", "44"]);
    });

    it("should revert trying to get several values, if one of values is zero", async () => {
      await updatePrices({ prices: { ETH: "44", BTC: "5000", USDC: "1234" } });
      await expect(
        multiAdapter.getValuesForDataFeeds(
          ["ETH", "INVALID", "BTC"].map(formatBytes32String)
        )
      ).to.be.revertedWith("InvalidLastUpdateDetails");
    });

    describe("Test values of different size, up to 32 bytes", () => {
      const valuesToTest = [
        "1",
        "10",
        "100000",
        "1231242141",
        "1231242141123123126767",
        "251635216352137128372183671267",
        "251635216352137128372183671261267321763721677",
        "2516352163521371283721836712612673217637216772321321321312312312312321",
        "25163521635213712837218367126126732176372167723213213213123123123123212321321",
        "45792089237316195423570985008687907853269984665640564039457584007913129639930",
        // "115792089237316195423570985008687907853269984665640564039457584007913129639935", <- this is type(uint256).max, but we can not use it because it doesn't work well with median calculation, it should be at least twice smaller
      ];

      for (const valueToTest of valuesToTest) {
        it(`should properly save and retrieve value: ${valueToTest}`, async () => {
          await updatePrices({ prices: { ETH: valueToTest } });
          await expectPrice("ETH", valueToTest);
        });
      }

      it(`should properly update values of different size for the same feed`, async () => {
        // We are testing values changing in different orders to check if our contract
        // works properly if we start needing bigger/smaller storage slot
        const newValuesToTest = [
          ...valuesToTest,
          ...[...valuesToTest].reverse(),
        ];

        for (const valueToTest of newValuesToTest) {
          await updatePrices({ prices: { ETH: valueToTest } });
          await expectPrice("ETH", valueToTest);
        }
      });
    });

    it("should revert if proposed data package timestamp is too old", async () => {
      await expect(
        updatePrices({
          prices: { ETH: "42" },
          prepareDataTime: (blockTime) => (blockTime - 3 * 60) * 1000,
        })
      ).to.be.revertedWith("TimestampIsTooOld");
    });

    it("should revert if proposed data package timestamp is too new", async () => {
      await expect(
        updatePrices({
          prices: { ETH: "42" },
          prepareDataTime: (blockTime) => (blockTime + 2 * 60) * 1000,
        })
      ).to.be.revertedWith("TimestampFromTooLongFuture");
    });

    describe("Tests of the updates independency for data feeds (value validation)", () => {
      describe("Value validation per feed", () => {
        it("should not fail if all feeds are invalid due to value", async () => {
          const tx = await updatePrices({ prices: { ETH: "0", BTC: "0" } });
          expect((await tx.wait()).events?.map((e) => e.event)).to.deep.eq([
            "UpdateSkipDueToInvalidValue", // for ETH
            "UpdateSkipDueToInvalidValue", // for BTC
          ]);
        });

        it("should update all valid feeds skip the rest (some feeds are valid, some - invalid)", async () => {
          const tx = await updatePrices({
            prices: { ETH: "0", USDC: "1234", BTC: "0", AVAX: "456" },
          });
          expect((await tx.wait()).events?.map((e) => e.event)).to.deep.eq([
            "UpdateSkipDueToInvalidValue", // for ETH
            "ValueUpdate", // for USDC
            "UpdateSkipDueToInvalidValue", // for BTC
            "ValueUpdate", // for AVAX
          ]);
          await expectPrice("USDC", "1234");
          await expectPrice("AVAX", "456");
        });

        it("should update all valid feeds skip the rest (only one feed is invalid)", async () => {
          const tx = await updatePrices({
            prices: { USDC: "1234", BTC: "0", AVAX: "456" },
          });
          expect((await tx.wait()).events?.map((e) => e.event)).to.deep.eq([
            "ValueUpdate", // for USDC
            "UpdateSkipDueToInvalidValue", // for BTC
            "ValueUpdate", // for AVAX
          ]);
          await expectPrice("USDC", "1234");
          await expectPrice("AVAX", "456");
        });

        it("should update all valid feeds skip the rest (only one feed is valid)", async () => {
          const tx = await updatePrices({
            prices: { USDC: "0", BTC: "0", AVAX: "456" },
          });
          expect((await tx.wait()).events?.map((e) => e.event)).to.deep.eq([
            "UpdateSkipDueToInvalidValue", // for USDC
            "UpdateSkipDueToInvalidValue", // for BTC
            "ValueUpdate", // for AVAX
          ]);
          await expectPrice("AVAX", "456");
        });
      });

      describe("Block timestamp validation per feed", () => {
        it("should not fail if all feeds have been updated in the same block", async () => {
          // Send 2 update txs in the same block
          await pauseAutomining();
          const tx1 = await updatePrices({
            prices: { A: "42", B: "1023", C: "123" },
          });
          const tx2 = await updatePrices({
            prices: { A: "43", B: "1024", C: "124" },
          });
          await resumeAutomining();

          // Checking txs effects
          expect((await tx1.wait()).events?.map((e) => e.event)).to.deep.eq([
            "ValueUpdate", // for A
            "ValueUpdate", // for B
            "ValueUpdate", // for C
          ]);
          expect((await tx2.wait()).events?.map((e) => e.event)).to.deep.eq([
            "UpdateSkipDueToBlockTimestamp",
            "UpdateSkipDueToBlockTimestamp",
            "UpdateSkipDueToBlockTimestamp",
          ]);
          await expectPrice("A", "42");
          await expectPrice("B", "1023");
          await expectPrice("C", "123");
        });

        it("should properly skip updates for feeds with the same block.timestamp", async () => {
          // Send 2 update txs in the same block
          await pauseAutomining();
          const tx1 = await updatePrices({
            prices: { BTC: "42", USDT: "1023" },
          });
          const tx2 = await updatePrices({
            prices: { BTC: "43", ETH: "12", DAI: "1000" },
          });
          await resumeAutomining();

          // Checking txs effects
          expect((await tx1.wait()).events?.map((e) => e.event)).to.deep.eq([
            "ValueUpdate", // for BTC
            "ValueUpdate", // for USDT
          ]);
          expect((await tx2.wait()).events?.map((e) => e.event)).to.deep.eq([
            "UpdateSkipDueToBlockTimestamp", // for BTC
            "ValueUpdate", // for ETH
            "ValueUpdate", // for DAI
          ]);
          await expectPrice("BTC", "42");
          await expectPrice("USDT", "1023");
          await expectPrice("ETH", "12");
          await expectPrice("DAI", "1000");
        });
      });

      describe("Data timestamp validation per feed", () => {
        it("should not fail if all feeds have the same data timestamp as before", async () => {
          // Sending 2 updates with the same data timestamp for all feeds
          const mockTimestamp = (await time.latest()) * 1000;
          const tx1 = await updatePrices({
            prices: { A: "42", B: "1023", C: "123" },
            prepareDataTime: () => mockTimestamp,
          });
          const tx2 = await updatePrices({
            prices: { A: "43", B: "1024", C: "124" },
            prepareDataTime: () => mockTimestamp,
          });

          // Checking txs effects
          expect((await tx1.wait()).events?.map((e) => e.event)).to.deep.eq([
            "ValueUpdate", // for A
            "ValueUpdate", // for B
            "ValueUpdate", // for C
          ]);
          expect((await tx2.wait()).events?.map((e) => e.event)).to.deep.eq([
            "UpdateSkipDueToDataTimestamp",
            "UpdateSkipDueToDataTimestamp",
            "UpdateSkipDueToDataTimestamp",
          ]);
          await expectPrice("A", "42");
          await expectPrice("B", "1023");
          await expectPrice("C", "123");
        });

        it("should properly skip updates for feeds with an older data timestamp than before", async () => {
          // Sending 2 updates (second has an older data timestamp)
          const mockTimestamp = (await time.latest()) * 1000;
          const tx1 = await updatePrices({
            prices: { BTC: "42" },
            prepareDataTime: () => mockTimestamp,
          });
          const tx2 = await updatePrices({
            prices: { BTC: "42", ETH: "12" },
            prepareDataTime: () => mockTimestamp - 1,
          });

          // Checking txs effects
          expect((await tx1.wait()).events?.map((e) => e.event)).to.deep.eq([
            "ValueUpdate", // for BTC
          ]);
          expect((await tx2.wait()).events?.map((e) => e.event)).to.deep.eq([
            "UpdateSkipDueToDataTimestamp", // for BTC
            "ValueUpdate", // for ETH
          ]);

          await expectPrice("BTC", "42");
          await expectPrice("ETH", "12");
        });

        it("should properly skip updates for feeds with the same data timestamp as before", async () => {
          // Sending 2 updates with the same timestamp
          const mockTimestamp = (await time.latest()) * 1000;
          const tx1 = await updatePrices({
            prices: { BTC: "42" },
            prepareDataTime: () => mockTimestamp,
          });
          const tx2 = await updatePrices({
            prices: { BTC: "42", ETH: "12" },
            prepareDataTime: () => mockTimestamp,
          });

          // Checking txs effects
          expect((await tx1.wait()).events?.map((e) => e.event)).to.deep.eq([
            "ValueUpdate", // for BTC
          ]);
          expect((await tx2.wait()).events?.map((e) => e.event)).to.deep.eq([
            "UpdateSkipDueToDataTimestamp", // for BTC
            "ValueUpdate", // for ETH
          ]);

          await expectPrice("BTC", "42");
          await expectPrice("ETH", "12");
        });
      });

      describe("Benchmark gas costs for view functions", () => {
        it("Gas cost for getLastUpdateDetailsUnsafe", async () => {
          await updatePrices({ prices: { ETH: "42" } });
          const gas = await multiAdapter.estimateGas.getLastUpdateDetailsUnsafe(
            formatBytes32String("ETH")
          );
          console.log(`Gas for getLastUpdateDetailsUnsafe: ${gas.toNumber()}`);
        });

        it("Gas cost for getLastUpdateDetails", async () => {
          await updatePrices({ prices: { ETH: "42" } });
          const gas = await multiAdapter.estimateGas.getLastUpdateDetails(
            formatBytes32String("ETH")
          );
          console.log(`Gas for getLastUpdateDetails: ${gas.toNumber()}`);
        });

        it.skip("Benchmark for reading last update details of up to 200 feeds", async () => {
          // Update prices
          const prices: Record<string, string> = {};
          for (let i = 0; i < 200; i++) {
            prices[`dataFeed${i}`] = (i * 100.24).toString();
          }
          await updatePrices({ prices });

          const dataFeedIds: string[] = [];
          for (let i = 0; i < 200; i++) {
            const dataFeedId = `dataFeed${i}`;
            dataFeedIds.push(formatBytes32String(dataFeedId));
            const gas =
              await multiAdapter.estimateGas.getLastUpdateDetailsUnsafeForMany(
                dataFeedIds
              );
            console.log(`\nGas costs for ${i + 1} feeds: ${gas.toNumber()}`);
          }
        });
      });
    });
  });
};
