import { BigNumber } from "ethers";
import { ICasperConnection } from "../../src/casper/ICasperConnection";
import { STORAGE_KEY_VALUES } from "../../src/contracts/constants";
import { PriceAdapterCasperContractAdapter } from "../../src/contracts/price_adapter/PriceAdapterCasperContractAdapter";
import { PriceAdapterCasperContractConnector } from "../../src/contracts/price_adapter/PriceAdapterCasperContractConnector";
import {
  contractDictionaryMock,
  getMockCasperConnection,
  makeContractParamsProviderMock,
  mockStateRootHashImplementations,
} from "../mock-utils";
import {
  testReadPricesFromContract,
  testWriteProcesFromPayloadToContract,
} from "./common-test-methods";

describe("PriceAdapterCasperContractAdapter tests", () => {
  let connection: jest.Mocked<ICasperConnection>;
  let connector: PriceAdapterCasperContractConnector;
  let adapter: PriceAdapterCasperContractAdapter;

  beforeEach(async () => {
    connection = getMockCasperConnection();
    connector = new PriceAdapterCasperContractConnector(connection, "");
    adapter =
      (await connector.getAdapter()) as PriceAdapterCasperContractAdapter;
    mockStateRootHashImplementations(connection);
  });

  it("writePricesFromPayloadToContract should callEntrypoint ENTRY_POINT_WRITE_PRICES", async () => {
    await testWriteProcesFromPayloadToContract(connection, adapter);
  });

  it("readTimestampFromContract should queryContractData about STORAGE_KEY_TIMESTAMP", async () => {
    await testReadPricesFromContract(connection, adapter, adapter);
  });

  it("readPricesFromContract should queryContractDictionary STORAGE_KEY_VALUES about feedIds", async () => {
    await testReadPricesFromContract(connection, adapter, adapter);
  });

  it("readPricesFromContract should return values even when one doesn't exist", async () => {
    connection.queryContractDictionary
      .mockImplementationOnce(
        contractDictionaryMock(
          adapter,
          STORAGE_KEY_VALUES,
          "ETH",
          BigNumber.from(12345)
        )
      )
      .mockRejectedValueOnce("")
      .mockImplementationOnce(
        contractDictionaryMock(
          adapter,
          STORAGE_KEY_VALUES,
          "BTC",
          BigNumber.from(54321)
        )
      );

    const values = await adapter.readPricesFromContract(
      makeContractParamsProviderMock(["ETH", "AVAX", "BTC"])
    );
    expect(values).toStrictEqual([
      BigNumber.from(12345),
      BigNumber.from(0),
      BigNumber.from(54321),
    ]);
  });

  it("getPricesFromPayload must not be executed", async () => {
    await expect(async () => {
      await adapter.getPricesFromPayload(makeContractParamsProviderMock());
    }).rejects.toThrow(
      "Method not supported. Use price_relay_adapter contract instead"
    );
  });
});
