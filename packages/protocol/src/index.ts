import { ethers } from "ethers";
import sortDeepObjectArrays from "sort-deep-object-arrays";

export type ConvertableToBytes32 = any;

export interface DataPoint {
  symbol: string;
  value: ConvertableToBytes32;
}

export interface DataPackage {
  dataPoints: DataPoint[];
  timestampMilliseconds: number;
}

export interface SignedDataPackage extends DataPackage {
  signature: string;
}

export const signDataPackage = async (
  dataPackage: DataPackage,
  privateKey: string
): Promise<SignedDataPackage> => {
  const dataToSignHex = getLiteDataToSign(dataPackage);
  const dataToSignBytes = ethers.utils.arrayify(dataToSignHex);
  const signer = new ethers.Wallet(privateKey);
  const signature = await signer.signMessage(dataToSignBytes);
  return {
    ...dataPackage,
    signature,
  };
};

// TODO: implement later
export const verifyDataPackageSignature = async (
  signedDataPackage: SignedDataPackage,
  expectedSigner: string
): Promise<boolean> => {
  // const serializedDataHex = getLiteDataToSign(signedDataPackage as DataPackage);
  // const
  return true;
};

const getLiteDataToSign = (dataPackage: DataPackage): string => {
  const serializedHexData =
    serializeUnsignedDataPackageToHexString(dataPackage);
  return ethers.utils.keccak256("0x" + serializedHexData);
};

export const serializeUnsignedDataPackageToHexString = (
  dataPackage: DataPackage
): string => {
  const sortedDataPoints: DataPoint[] = sortDeepObjectArrays(
    dataPackage.dataPoints
  );

  // Calculating lite price data bytes array
  let data = "";
  for (const dataPoint of sortedDataPoints) {
    const symbol = convertStringToBytes32String(dataPoint.symbol);
    const value = serializeNumericValue(dataPoint.value);
    data += symbol.substr(2) + value.toString(16).padStart(64, "0");
  }
  data += Math.ceil(dataPackage.timestampMilliseconds / 1000)
    .toString(16)
    .padStart(64, "0");

  return data;
};

export const serializeSignedDataPackageToHexString = (
  signedDataPackage: SignedDataPackage
) => {
  const valuesAndTimestampSerialized = serializeUnsignedDataPackageToHexString(
    signedDataPackage as DataPackage
  );
  const dataPointsCountSerialized = signedDataPackage.dataPoints.length
    .toString(16)
    .padStart(2, "0");
  const signatureSerialized = signedDataPackage.signature.replace("0x", "");
  return (
    valuesAndTimestampSerialized +
    dataPointsCountSerialized +
    signatureSerialized
  );
};

const serializeNumericValue = (value: number) => Math.round(value * 10 ** 8);

const convertStringToBytes32String = (str: string) => {
  if (str.length > 31) {
    // TODO: improve checking if str is a valid bytes32 string later
    const bytes32StringLength = 32 * 2 + 2; // 32 bytes (each byte uses 2 symbols) + 0x
    if (str.length === bytes32StringLength && str.startsWith("0x")) {
      return str;
    } else {
      // Calculate keccak hash if string is bigger than 32 bytes
      return ethers.utils.id(str);
    }
  } else {
    return ethers.utils.formatBytes32String(str);
  }
};

export default {
  signDataPackage,
  verifyDataPackageSignature,
  serializeUnsignedDataPackageToHexString,
};
