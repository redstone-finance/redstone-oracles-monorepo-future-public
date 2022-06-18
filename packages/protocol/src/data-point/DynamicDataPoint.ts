import { concat } from "ethers/lib/utils";
import { VALUE_BYTE_SIZE_BS } from "../common/redstone-consts";
import { convertIntegerNumberToBytes } from "../common/utils";
import { DataPointBase } from "./DataPointBase";

export class DynamicDataPoint extends DataPointBase {
  serializeToBytes(): Uint8Array {
    const valueByteSize = convertIntegerNumberToBytes(
      this.value.length,
      VALUE_BYTE_SIZE_BS
    );
    return concat([super.serializeToBytes(), valueByteSize]);
  }
}
