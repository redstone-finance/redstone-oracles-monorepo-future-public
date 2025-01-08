import {
  DataPackagesRequestParams,
  DataPackagesResponseCache,
} from "@redstone-finance/sdk";
import { RedstoneLogger } from "@redstone-finance/utils";
import { expect } from "chai";
import sinon from "sinon";
import {
  EvmContractFacade,
  IterationArgsProvider,
  RelayerConfig,
  runIteration,
} from "../../src";
import {
  ContractParamsProviderMock,
  DEFAULT_DATA_POINTS,
  mockConfig,
} from "../helpers";
import {
  ContractConnectorMock,
  getIterationArgsProviderMock,
} from "./run-iteration-mocks";

const UPDATE_CONDITION_SATISFIED_REGEXP =
  /Update condition satisfied; block_number=123432 iteration_duration=/;
const UPDATE_CONDITION_NOT_SATISFIED_REGEXP =
  /Update condition NOT satisfied; block_number=123432 iteration_duration=/;

describe("runIteration tests", () => {
  let connector: ContractConnectorMock;
  let sendHealthcheckPingStub: sinon.SinonStub;
  let updatePricesStub: sinon.SinonStub;
  let loggerStub: { log: sinon.SinonStub };
  let requestDataPackagesStub: sinon.SinonStub;
  let relayerConfig: RelayerConfig;

  beforeEach(() => {
    relayerConfig = mockConfig();
    sendHealthcheckPingStub = sinon.stub().resolves();
    loggerStub = {
      log: sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should call updatePrices if shouldUpdatePrices is true", async () => {
    await performRunIterationTest(relayerConfig);

    expect(updatePricesStub.calledOnce).to.be.true;
    expect(sendHealthcheckPingStub.calledOnceWith("http://example.com/ping")).to
      .be.true;
    expect(requestDataPackagesStub.calledOnce).to.be.true;
    sinon.assert.calledWith(
      loggerStub.log,
      sinon.match(UPDATE_CONDITION_SATISFIED_REGEXP)
    );
    expect(loggerStub.log.lastCall.lastArg).to.deep.equal(["Test message"]);
  });

  it("should call updatePrices and not to call requestDataPackages if shouldUpdatePrices is true with cache", async () => {
    await performRunIterationTest(
      relayerConfig,
      getIterationArgsProviderMock(),
      new DataPackagesResponseCache().update(
        {},
        {} as DataPackagesRequestParams
      )
    );

    expect(updatePricesStub.calledOnce).to.be.true;
    expect(sendHealthcheckPingStub.calledOnceWith("http://example.com/ping")).to
      .be.true;
    expect(requestDataPackagesStub.called).to.be.false;
    sinon.assert.calledWith(
      loggerStub.log,
      sinon.match(UPDATE_CONDITION_SATISFIED_REGEXP)
    );
    expect(loggerStub.log.lastCall.lastArg).to.deep.equal(["Test message"]);
  });

  it("should call updatePrices and call requestDataPackages if shouldUpdatePrices is true with cache, but cache is not conforming", async () => {
    await performRunIterationTest(
      relayerConfig,
      getIterationArgsProviderMock(),
      new DataPackagesResponseCache().update({}, {
        dataServiceId: "other",
      } as DataPackagesRequestParams)
    );

    expect(updatePricesStub.calledOnce).to.be.true;
    expect(sendHealthcheckPingStub.calledOnceWith("http://example.com/ping")).to
      .be.true;
    expect(requestDataPackagesStub.calledOnce).to.be.true;
    sinon.assert.calledWith(
      loggerStub.log,
      sinon.match(UPDATE_CONDITION_SATISFIED_REGEXP)
    );
    expect(loggerStub.log.lastCall.lastArg).to.deep.equal(["Test message"]);
  });

  it("should not call updatePrices if shouldUpdatePrices is false", async () => {
    await performRunIterationTest(
      relayerConfig,
      getIterationArgsProviderMock(false)
    );

    expect(updatePricesStub.called).to.be.false;
    expect(sendHealthcheckPingStub.calledOnceWith("http://example.com/ping")).to
      .be.true;
    expect(requestDataPackagesStub.calledOnce).to.be.true;
    sinon.assert.calledWith(
      loggerStub.log,
      sinon.match(UPDATE_CONDITION_NOT_SATISFIED_REGEXP)
    );
    expect(loggerStub.log.lastCall.lastArg).to.deep.equal(["Test message"]);
  });

  it("should log additional messages if present and shouldUpdatePrices is true", async () => {
    await performRunIterationTest(
      relayerConfig,
      getIterationArgsProviderMock(true, [
        { message: "Additional message" },
        { message: "Other message" },
      ])
    );

    expect(loggerStub.log.calledWith("Additional message")).to.be.true;
    expect(loggerStub.log.calledWith("Other message")).to.be.true;
  });

  async function performRunIterationTest(
    relayerConfig: RelayerConfig,
    iterationArgsProvider: IterationArgsProvider = getIterationArgsProviderMock(),
    cache?: DataPackagesResponseCache
  ) {
    connector = new ContractConnectorMock();
    const adapter = await connector.getAdapter();
    updatePricesStub = sinon
      .stub(adapter, "writePricesFromPayloadToContract")
      .resolves();

    const facade = new EvmContractFacade(connector, cache);
    const contractParamsProvider = new ContractParamsProviderMock(
      DEFAULT_DATA_POINTS,
      undefined,
      cache
    );
    sinon
      .stub(facade, "getContractParamsProvider")
      .returns(contractParamsProvider);

    requestDataPackagesStub = sinon.stub(
      contractParamsProvider,
      "performRequestingDataPackages"
    );

    await runIteration(
      facade,
      relayerConfig,
      loggerStub as unknown as RedstoneLogger,
      iterationArgsProvider,
      sendHealthcheckPingStub
    );
  }
});
