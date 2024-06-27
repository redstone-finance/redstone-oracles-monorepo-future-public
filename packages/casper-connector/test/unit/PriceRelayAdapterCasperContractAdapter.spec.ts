import { RuntimeArgs } from "casper-js-sdk";
import {
  PriceAdapterCasperContractAdapter,
  PriceAdapterCasperContractConnector,
  PriceRelayAdapterCasperContractAdapter,
  PriceRelayAdapterCasperContractConnector,
} from "../../src";
import { ICasperConnection } from "../../src/casper/ICasperConnection";
import { decodeHex, decodeNumber } from "../../src/casper/utils";
import { RunMode } from "../../src/contracts/RunMode";
import { RuntimeArgsFactory } from "../../src/contracts/RuntimeArgsFactory";
import {
  ARG_NAME_CHUNK_INDEX,
  ARG_NAME_HASH,
  ENTRY_POINT_GET_PRICES,
  ENTRY_POINT_GET_PRICES_CHUNK,
  ENTRY_POINT_WRITE_PRICES_CHUNK,
  STORAGE_KEY_ADAPTER_ADDRESS,
} from "../../src/contracts/constants";
import {
  MOCK_PAYLOAD_HASH,
  MOCK_PAYLOAD_HEX,
  callEntrypointMock,
  contractDataMock,
  getMockCasperConnection,
  makeContractParamsProviderMock,
  mockStateRootHashImplementations,
} from "../mock-utils";
import {
  checkPayloadRuntimeArgs,
  testGetPricesFromPayload,
  testReadPricesFromContract,
  testReadTimestampFromContract,
  testWriteProcesFromPayloadToContract,
} from "./common-test-methods";

describe("PriceRelayAdapterCasperContractAdapter", () => {
  let connection: jest.Mocked<ICasperConnection>;
  let connector: PriceRelayAdapterCasperContractConnector;
  let adapter: PriceRelayAdapterCasperContractAdapter;
  let wrappedAdapter: PriceAdapterCasperContractAdapter;

  beforeEach(async () => {
    connection = getMockCasperConnection();
    connector = new PriceRelayAdapterCasperContractConnector(
      connection,
      "556677"
    );
    adapter =
      (await connector.getAdapter()) as PriceRelayAdapterCasperContractAdapter;
    wrappedAdapter = (await new PriceAdapterCasperContractConnector(
      connection,
      "112233"
    ).getAdapter()) as PriceAdapterCasperContractAdapter;
    adapter.wrappedContractAdapter = wrappedAdapter;
    mockStateRootHashImplementations(connection);
  });

  it("writePricesFromPayloadToContract should callEntrypoint ENTRY_POINT_WRITE_PRICES", async () => {
    await testWriteProcesFromPayloadToContract(connection, adapter);
  });

  it("readTimestampFromContract should queryContractData of wrappedAdapter about STORAGE_KEY_TIMESTAMP", async () => {
    await testReadTimestampFromContract(connection, adapter, wrappedAdapter);
  });

  it("readPricesFromContract should queryContractDictionary of wrappedAdapter STORAGE_KEY_VALUES about feedIds", async () => {
    await testReadPricesFromContract(connection, adapter, wrappedAdapter);
  });

  it("readTimestampFromContract should queryContractData about STORAGE_KEY_ADAPTER_ADDRESS and then queryContractData of wrappedAdapter about STORAGE_KEY_TIMESTAMP", async () => {
    adapter.wrappedContractAdapter = undefined;

    connection.queryContractData.mockImplementationOnce(
      contractDataMock(adapter, STORAGE_KEY_ADAPTER_ADDRESS, "0x112233")
    );

    await testReadTimestampFromContract(connection, adapter, wrappedAdapter);
  });

  it("readPricesFromContract should queryContractData about STORAGE_KEY_ADAPTER_ADDRESS and then queryContractDictionary of wrappedAdapter STORAGE_KEY_VALUES about feedIds", async () => {
    adapter.wrappedContractAdapter = undefined;

    connection.queryContractData.mockImplementationOnce(
      contractDataMock(adapter, STORAGE_KEY_ADAPTER_ADDRESS, "0x112233")
    );

    await testReadPricesFromContract(connection, adapter, wrappedAdapter);
  });

  it("getPricesFromPayload should callEntrypoint ENTRY_POINT_GET_PRICES and then queryContractDictionary STORAGE_KEY_VALUES about payload hash", async () => {
    connection.callEntrypoint.mockImplementationOnce(
      callEntrypointMock(
        adapter,
        ENTRY_POINT_GET_PRICES,
        0,
        checkPayloadRuntimeArgs()
      )
    );
    await testGetPricesFromPayload(connection, adapter);
  });

  it("getPricesFromPayload should callEntrypoint ENTRY_POINT_GET_PRICES_CHUNK if the payload exceeds the CHUNK_SIZE and then queryContractDictionary STORAGE_KEY_VALUES about payload hash", async () => {
    RuntimeArgsFactory.CHUNK_SIZE_BYTES = 1;

    connection.callEntrypoint
      .mockImplementationOnce(getChunkEntrypointMock(RunMode.GET, "OK1", 0))
      .mockImplementationOnce(getChunkEntrypointMock(RunMode.GET, "OK2", 1))
      .mockImplementationOnce(getChunkEntrypointMock(RunMode.GET, "OK3", 2));

    await testGetPricesFromPayload(connection, adapter);
  });

  it("writePricesFromPayloadToContract should callEntrypoint ENTRY_POINT_WRITE_PRICES_CHUNK if the payload exceeds the CHUNK_SIZE", async () => {
    RuntimeArgsFactory.CHUNK_SIZE_BYTES = 1;

    connection.callEntrypoint
      .mockImplementationOnce(getChunkEntrypointMock(RunMode.WRITE, "OK1", 0))
      .mockImplementationOnce(getChunkEntrypointMock(RunMode.WRITE, "OK2", 1))
      .mockImplementationOnce(getChunkEntrypointMock(RunMode.WRITE, "OK3", 2));

    const deployId = await adapter.writePricesFromPayloadToContract(
      makeContractParamsProviderMock()
    );
    expect(deployId).toEqual("OK3");
  });

  function getChunkEntrypointMock(
    mode: RunMode,
    value: string,
    chunkIndex: number
  ) {
    return callEntrypointMock(
      adapter,
      mode === RunMode.WRITE
        ? ENTRY_POINT_WRITE_PRICES_CHUNK
        : ENTRY_POINT_GET_PRICES_CHUNK,
      0,
      (runtimeArgs: RuntimeArgs) => {
        checkPayloadRuntimeArgs(
          MOCK_PAYLOAD_HEX.substring(chunkIndex * 2, (chunkIndex + 1) * 2)
        )(runtimeArgs);

        expect(
          decodeNumber(runtimeArgs.args.get(ARG_NAME_CHUNK_INDEX))
        ).toEqual(chunkIndex);
        expect(decodeHex(runtimeArgs.args.get(ARG_NAME_HASH))).toEqual(
          MOCK_PAYLOAD_HASH
        );
      },
      value
    );
  }
});
