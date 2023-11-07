import { BytesLike, sha256 as sha256Ethers } from "ethers/lib/utils";

export const sha256ToHex = (data: BytesLike): string => sha256Ethers(data);
