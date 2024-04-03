import { ContractParamsProviderMock } from "@redstone-finance/sdk";
import { Contracts, RuntimeArgs } from "casper-js-sdk";
import { ICasperConnection } from "../src/casper/ICasperConnection";
import { CasperContractAdapter } from "../src/contracts/CasperContractAdapter";

export function getMockCasperConnection() {
  return {
    getBlockHeight: jest.fn(),
    refreshStateRootHash: jest.fn(),
    getStateRootHash: jest.fn(),
    waitForDeploy: jest.fn(),
    waitForDeploys: jest.fn(),
    queryGlobalState: jest.fn(),
    queryContractDictionary: jest.fn(),
    queryContractData: jest.fn(),
    callEntrypoint: jest.fn(),
  };
}

export const MOCK_PAYLOAD_HEX = "455448";
export const MOCK_PAYLOAD_HASH =
  "aa602e9895fd07a75b1becbb3dd5f409664cff5047117eb4a16e8e3c8fdf4641";

export function makeContractParamsProviderMock(
  feedIds: string[] = ["ETH", "BTC"]
) {
  return new ContractParamsProviderMock(feedIds, "./payload.hex", (_) =>
    Buffer.from(MOCK_PAYLOAD_HEX)
  );
}

export function contractDictionaryMock<T>(
  expectedAdapter: CasperContractAdapter,
  expectedName: string,
  expectedKey: string,
  value: T,
  expectedStateRootHash: string | undefined = undefined
) {
  return (
    contract: Contracts.Contract,
    dictionaryName: string,
    dictionaryItemKey: string,
    _decoder: unknown
  ) => {
    expect(dictionaryName).toEqual(expectedName);
    expect(dictionaryItemKey).toEqual(expectedKey);
    expect(expectedStateRootHash).toEqual(
      expectedAdapter.connection.getStateRootHash()
    );
    expect(contract).toEqual(expectedAdapter.contract);

    return Promise.resolve(value);
  };
}

export function contractDataMock<T>(
  expectedAdapter: CasperContractAdapter,
  expectedKey: string,
  value: T,
  expectedStateRootHash: string | undefined = undefined
) {
  return (contract: Contracts.Contract, key: string) => {
    expect(key).toEqual(expectedKey);
    expect(expectedStateRootHash).toEqual(
      expectedAdapter.connection.getStateRootHash()
    );
    expect(contract).toEqual(expectedAdapter.contract);

    return Promise.resolve(value);
  };
}

//TODO: expectedCsprAmount
export function callEntrypointMock(
  expectedAdapter: CasperContractAdapter,
  expectedEntryPoint: string,
  expectedCsprAmount: number,
  runtimeArgsCheck: (runtimeArgs: RuntimeArgs) => void,
  value: string = "OK"
) {
  return (
    contract: Contracts.Contract,
    entryPoint: string,
    csprAmount: number,
    runtimeArgs: RuntimeArgs
  ) => {
    expect(entryPoint).toEqual(expectedEntryPoint);
    expect(contract).toEqual(expectedAdapter.contract);

    runtimeArgsCheck(runtimeArgs);

    return Promise.resolve(value);
  };
}

export function mockStateRootHashImplementations(
  connection: jest.Mocked<ICasperConnection>
) {
  connection.waitForDeploy.mockResolvedValue(true);
  // eslint-disable-next-line @typescript-eslint/require-await
  connection.refreshStateRootHash.mockImplementationOnce(async () => {
    connection.getStateRootHash.mockReturnValue("2");
  });
}
