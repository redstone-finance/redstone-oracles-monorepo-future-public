import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { PriceFeedsAdapterMock } from "../../typechain-types";
import { updatePrices } from "../../src/core/contract-interactions/update-prices";
import { getLastRoundParamsFromContract } from "../../src/core/contract-interactions/get-last-round-params";
import { server } from "./mock-server";
import {
  dataFeedsIds,
  getDataPackagesResponse,
  mockEnvVariables,
} from "../helpers";

chai.use(chaiAsPromised);

describe("#updatePrices", () => {
  let managerContract: PriceFeedsAdapterMock;

  before(() => {
    mockEnvVariables();
    server.listen();
  });

  beforeEach(async () => {
    const MangerContractFactory = await ethers.getContractFactory(
      "PriceFeedsAdapterMock"
    );
    managerContract = await MangerContractFactory.deploy(dataFeedsIds);
    await managerContract.deployed();
  });

  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it("should update price", async () => {
    const { lastRound, lastUpdateTimestamp } =
      await getLastRoundParamsFromContract(managerContract);
    const dataPackages = getDataPackagesResponse();
    await updatePrices(
      dataPackages,
      managerContract,
      lastRound,
      lastUpdateTimestamp
    );
    const [round] = await managerContract.getLastRoundParams();
    expect(round).to.be.equal(1);
    const dataFeedsValues = await managerContract.getValuesForDataFeeds(
      dataFeedsIds
    );
    expect(dataFeedsValues[0]).to.be.equal(167099000000);
    expect(dataFeedsValues[1]).to.be.equal(2307768000000);
  });
});
