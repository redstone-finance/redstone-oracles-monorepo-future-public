import { BigNumber } from "ethers";
import { ICasperConnection } from "../../src/casper/ICasperConnection";
import {
  ENTRY_POINT_GET_PRICE_AND_TIMESTAMP,
  STORAGE_KEY_TIMESTAMP,
  STORAGE_KEY_VALUE,
} from "../../src/contracts/constants";
import { PriceFeedCasperContractAdapter } from "../../src/contracts/price_feed/PriceFeedCasperContractAdapter";
import { PriceFeedCasperContractConnector } from "../../src/contracts/price_feed/PriceFeedCasperContractConnector";
import {
  callEntrypointMock,
  contractDataMock,
  getMockCasperConnection,
  mockStateRootHashImplementations,
} from "../mock-utils";

describe("PriceFeedCasperContractAdapter tests", () => {
  let connection: jest.Mocked<ICasperConnection>;
  let connector: PriceFeedCasperContractConnector;
  let adapter: PriceFeedCasperContractAdapter;

  beforeEach(async () => {
    connection = getMockCasperConnection();
    connector = new PriceFeedCasperContractConnector(connection, "0x5555");
    adapter = await connector.getAdapter();
    mockStateRootHashImplementations(connection);
  });

  it("readTimestampFromContract should queryContractData about STORAGE_KEY_TIMESTAMP", async () => {
    connection.queryContractData.mockImplementationOnce(
      contractDataMock(adapter, STORAGE_KEY_TIMESTAMP, BigNumber.from(2233))
    );

    const timestamp = await adapter.readTimestampFromContract();
    expect(timestamp).toEqual(2233);
  });

  it("readValueFromContract should queryContractData about STORAGE_KEY_VALUE", async () => {
    connection.queryContractData.mockImplementationOnce(
      contractDataMock(adapter, STORAGE_KEY_VALUE, BigNumber.from(12345))
    );

    const timestamp = await adapter.readValueFromContract();
    expect(timestamp).toEqual(BigNumber.from(12345));
  });

  it("getPriceAndTimestamp should callEntrypoint ENTRY_POINT_GET_PRICE_AND_TIMESTAMP about STORAGE_KEY_VALUE", async () => {
    connection.callEntrypoint.mockImplementationOnce(
      callEntrypointMock(
        adapter,
        ENTRY_POINT_GET_PRICE_AND_TIMESTAMP,
        0,
        (runtimeArgs) => {
          expect(runtimeArgs.args.size).toEqual(0);
        }
      )
    );

    connection.queryContractData
      .mockImplementationOnce(
        contractDataMock(adapter, STORAGE_KEY_VALUE, BigNumber.from(54321), "2")
      )
      .mockImplementationOnce(
        contractDataMock(
          adapter,
          STORAGE_KEY_TIMESTAMP,
          BigNumber.from(2233),
          "2"
        )
      );

    const { value, timestamp } = await adapter.getPriceAndTimestamp();
    expect(timestamp).toEqual(2233);
    expect(value).toEqual(BigNumber.from(54321));
  });
});
