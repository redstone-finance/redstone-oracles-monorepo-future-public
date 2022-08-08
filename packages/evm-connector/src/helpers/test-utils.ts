import { arrayify } from "@ethersproject/bytes";
import { ethers } from "ethers";
import {
  DataPackage,
  DataPoint,
  INumericDataPoint,
  IStringDataPoint,
  NumericDataPoint,
  StringDataPoint,
  utils,
} from "redstone-protocol";
import { ConvertableToBytes32 } from "redstone-protocol/src/common/utils";
import { MockDataPackageConfig } from "../wrappers/MockWrapper";

export type MockSignerIndex =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19;

export type MockSignerAddress =
  | "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  | "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  | "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
  | "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
  | "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
  | "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
  | "0x976EA74026E726554dB657fA54763abd0C3a0aa9"
  | "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"
  | "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f"
  | "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"
  | "0xBcd4042DE499D14e55001CcbB24a551F3b954096"
  | "0x71bE63f3384f5fb98995898A86B02Fb2426c5788"
  | "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a"
  | "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec"
  | "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097"
  | "0xcd3B766CCDd6AE721141F452C550Ca635964ce71"
  | "0x2546BcD3c84621e976D8185a91A922aE77ECEc30"
  | "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E"
  | "0xdD2FD4581271e230360230F9337D5c0430Bf44C0"
  | "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

export interface MockPackageArgs {
  mockSignerIndex: MockSignerIndex;
  timestampMilliseconds?: number;
}

export interface MockNumericPackageArgs extends MockPackageArgs {
  dataPoints: INumericDataPoint[];
}

export interface MockStringPackageArgs extends MockPackageArgs {
  dataPoints: IStringDataPoint[];
}

export interface MockPackageWithOneNumericDataPointArgs
  extends MockPackageArgs,
    INumericDataPoint {}

export interface MockPackageWithOneBytesDataPointArgs extends MockPackageArgs {
  dataFeedId?: ConvertableToBytes32;
  hexValue: string;
}

// We lock the timestamp to have deterministic gas consumption
// for being able to compare gas costs of different implementations
export const DEFAULT_TIMESTAMP_FOR_TESTS = 1654353400000;

// Default data feed id
// Used in mock data packages with one data point
export const DEFAULT_DATA_FEED_ID =
  "SOME LONG STRING FOR DATA FEED ID TO TRIGGER SYMBOL HASHING";
export const DEFAULT_DATA_FEED_ID_BYTES_32 =
  utils.convertStringToBytes32(DEFAULT_DATA_FEED_ID);

// Well-known private keys, which are used by
// default in hardhat testing environment
export const MOCK_PRIVATE_KEYS: string[] = [];

// Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
MOCK_PRIVATE_KEYS[0] =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
MOCK_PRIVATE_KEYS[1] =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

// Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
MOCK_PRIVATE_KEYS[2] =
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";

// Address: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
MOCK_PRIVATE_KEYS[3] =
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6";

// Address: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
MOCK_PRIVATE_KEYS[4] =
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a";

// Address: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc
MOCK_PRIVATE_KEYS[5] =
  "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba";

// Address: 0x976EA74026E726554dB657fA54763abd0C3a0aa9
MOCK_PRIVATE_KEYS[6] =
  "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e";

// Address: 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955
MOCK_PRIVATE_KEYS[7] =
  "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356";

// Address: 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f
MOCK_PRIVATE_KEYS[8] =
  "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97";

// Address: 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720
MOCK_PRIVATE_KEYS[9] =
  "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6";

// Address: 0xBcd4042DE499D14e55001CcbB24a551F3b954096
MOCK_PRIVATE_KEYS[10] =
  "0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897";

// Address: 0x71bE63f3384f5fb98995898A86B02Fb2426c5788
MOCK_PRIVATE_KEYS[11] =
  "0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82";

// Address: 0xFABB0ac9d68B0B445fB7357272Ff202C5651694a
MOCK_PRIVATE_KEYS[12] =
  "0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1";

// Address: 0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec
MOCK_PRIVATE_KEYS[13] =
  "0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd";

// Address: 0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097
MOCK_PRIVATE_KEYS[14] =
  "0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa";

// Address: 0xcd3B766CCDd6AE721141F452C550Ca635964ce71
MOCK_PRIVATE_KEYS[15] =
  "0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61";

// Address: 0x2546BcD3c84621e976D8185a91A922aE77ECEc30
MOCK_PRIVATE_KEYS[16] =
  "0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0";

// Address: 0xbDA5747bFD65F08deb54cb465eB87D40e51B197E
MOCK_PRIVATE_KEYS[17] =
  "0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd";

// Address: 0xdD2FD4581271e230360230F9337D5c0430Bf44C0
MOCK_PRIVATE_KEYS[18] =
  "0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0";

// Address: 0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199
MOCK_PRIVATE_KEYS[19] =
  "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e";

export const MOCK_SIGNERS = MOCK_PRIVATE_KEYS.map(
  (privateKey) => new ethers.Wallet(privateKey)
);

export const getMockSignerPrivateKey = (
  mockSignerAddress: MockSignerAddress
) => {
  for (const privateKey of MOCK_PRIVATE_KEYS) {
    const address = new ethers.Wallet(privateKey).address;
    if (address === mockSignerAddress) {
      return privateKey;
    }
  }
  throw new Error(`Invalid mock signer address: ${mockSignerAddress}`);
};

export const getMockPackage = (
  opts: MockPackageArgs,
  dataPoints: DataPoint[]
): MockDataPackageConfig => {
  const timestampMilliseconds =
    opts.timestampMilliseconds || DEFAULT_TIMESTAMP_FOR_TESTS;
  return {
    signer: MOCK_SIGNERS[opts.mockSignerIndex].address as MockSignerAddress,
    dataPackage: new DataPackage(dataPoints, timestampMilliseconds),
  };
};

export const getMockNumericPackage = (
  args: MockNumericPackageArgs
): MockDataPackageConfig => {
  const numericDataPoints = args.dataPoints.map(
    (dp) => new NumericDataPoint(dp)
  );
  return getMockPackage(args, numericDataPoints);
};

export const getMockStringPackage = (
  args: MockStringPackageArgs
): MockDataPackageConfig => {
  const stringDataPoints = args.dataPoints.map((dp) => new StringDataPoint(dp));
  return getMockPackage(args, stringDataPoints);
};

export const getMockPackageWithOneNumericDataPoint = (
  args: MockPackageWithOneNumericDataPointArgs
): MockDataPackageConfig => {
  const numericDataPoint = new NumericDataPoint({
    ...args,
    dataFeedId: args.dataFeedId || DEFAULT_DATA_FEED_ID,
  });
  return getMockPackage(args, [numericDataPoint]);
};

export const getMockPackageWithOneBytesDataPoint = (
  args: MockPackageWithOneBytesDataPointArgs
): MockDataPackageConfig => {
  const dataPoint = new DataPoint(
    args.dataFeedId || DEFAULT_DATA_FEED_ID,
    arrayify(args.hexValue)
  );
  return getMockPackage(args, [dataPoint]);
};

// Prepares an array with sequential numbers
export const getRange = (rangeArgs: {
  start: number;
  length: number;
}): number[] => {
  return [...Array(rangeArgs.length).keys()].map((i) => (i += rangeArgs.start));
};
