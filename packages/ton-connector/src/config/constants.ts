import { consts } from "@redstone-finance/protocol";
import assert from "assert";

export const OP_NUMBER_BITS = 256;
export const SIGNER_COUNT_THRESHOLD_BITS = 8;

export const OP_REDSTONE_WRITE_PRICES = BigInt(
  "0x479227d578c45748b6c76eac834302019001b3ee2362a2921a367b76dee3760e"
); // keccak(RedStone_Write_Prices)
export const OP_REDSTONE_WRITE_PRICE = BigInt(
  "0x5a8b42dd1771940342d821304acc3de572bf8353a29f25959e46d814b15702f5"
); // keccak(RedStone_Write_Price)

export const OP_REDSTONE_FETCH_DATA = BigInt(
  "0x31a4a6560a71d9b83d4e2fe08cf460dc0163a78ca5cb069320b889323e60271f"
); //keccak(RedStone_Fetch_Data)

export const KEY_LEN_BITS = 256;
assert(KEY_LEN_BITS == consts.DATA_FEED_ID_BS * 8);
