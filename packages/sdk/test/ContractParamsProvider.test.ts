import {
  mockPayload,
  mockSignedDataPackagesResponse,
} from "./mocks/mock-packages";
// Do not remove this empty line to have the mocks working
import { arrayify } from "ethers/lib/utils";
import {
  ContractParamsProvider,
  DataPackagesRequestParams,
  DataPackagesResponseCache,
  requestDataPackages,
} from "../src";

jest.mock("../src/request-data-packages", () => ({
  requestDataPackages: jest
    .fn()
    .mockResolvedValue(mockSignedDataPackagesResponse),
}));

describe("ContractParamsProvider tests", () => {
  const mockRequestParams: DataPackagesRequestParams = {
    dataServiceId: "service-1",
    uniqueSignersCount: 2,
    dataPackagesIds: ["ETH", "BTC"],
  };
  let sut: ContractParamsProvider;

  beforeEach(() => {
    sut = new ContractParamsProvider(mockRequestParams);
    jest.clearAllMocks();
  });

  it("should generate payload hex with prefix", async () => {
    const payloadHex = await sut.getPayloadHex(true);
    expect(payloadHex).toBe(`0x${mockPayload}`);
  });

  it("should generate payload hex without prefix", async () => {
    const payloadHex = await sut.getPayloadHex(false);
    expect(payloadHex).toBe(mockPayload);
  });

  it("should convert hex payload to array of numbers", async () => {
    const payloadData = await sut.getPayloadData();
    expect(payloadData).toEqual(Array.from(arrayify("0x" + mockPayload)));
  });

  it("should return hexlified feed IDs", () => {
    expect(sut.getHexlifiedFeedIds()).toEqual(["0x455448", "0x425443"]);
  });

  it("should return data feed IDs", () => {
    expect(sut.getDataFeedIds()).toEqual(mockRequestParams.dataPackagesIds);

    const overrideIds = ["override1", "override2"];
    sut = new ContractParamsProvider(mockRequestParams, undefined, overrideIds);
    expect(sut.getDataFeedIds()).toEqual(overrideIds);
  });

  it("should return cached data packages if available", async () => {
    const cache = new DataPackagesResponseCache();
    const newResponse = {
      ...mockSignedDataPackagesResponse,
      XXX: mockSignedDataPackagesResponse["ETH"],
    };
    cache.update(newResponse, mockRequestParams);
    sut = new ContractParamsProvider(
      { ...mockRequestParams, dataPackagesIds: ["ETH", "XXX", "BTC"] },
      cache
    );

    const result = await sut.requestDataPackages();

    expect(result).toBe(newResponse);
    expect(result).not.toBe(mockSignedDataPackagesResponse);
    expect(requestDataPackages).not.toHaveBeenCalled();
  });

  it("should request data packages if not cached", async () => {
    const result = await sut.requestDataPackages();
    expect(requestDataPackages).toHaveBeenCalledWith(mockRequestParams);
    expect(result).toBe(mockSignedDataPackagesResponse);
  });
});
