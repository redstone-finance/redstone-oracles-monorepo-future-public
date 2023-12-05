import { TonContract } from "../../src/TonContract";
import {
  createArrayFromTuple,
  createBuilderFromString,
  createTupleItems,
} from "../../src/ton-utils";

import { Cell, ContractProvider, serializeTuple } from "@ton/core";
import { hexlify } from "ethers/lib/utils";

/* eslint-disable  @typescript-eslint/class-methods-use-this -- TON Getter methods must not be static */
export class TonUnitTester extends TonContract {
  async getTestGetDataPackageSignerAddress(
    provider: ContractProvider,
    data: string,
    signature: string
  ) {
    const { stack } = await provider.get(
      "test_get_data_package_signer_address",
      [
        {
          type: "slice",
          cell: createBuilderFromString(data).asCell(),
        },
        {
          type: "slice",
          cell: createBuilderFromString(signature).asCell(),
        },
      ]
    );

    return hexlify(stack.readBigNumber()).toLowerCase();
  }

  async getTestMedian(provider: ContractProvider, numbers: number[]) {
    const { stack } = await provider.get("test_median", [
      {
        type: "tuple",
        items: createTupleItems(numbers),
      },
    ]);

    return stack.readNumber();
  }

  async getTestSliceUint(
    provider: ContractProvider,
    data: string | Cell,
    byteLength: number
  ) {
    const { stack } = await provider.get("test_slice_uint", [
      {
        type: "slice",
        cell:
          typeof data == "string"
            ? createBuilderFromString(data).asCell()
            : data,
      },
      {
        type: "int",
        value: BigInt(byteLength * 8),
      },
    ]);

    return { remainingSlice: stack.readCell(), value: stack.readBigNumber() };
  }

  async getTestSliceInt(
    provider: ContractProvider,
    data: string | Cell,
    bitLength: number
  ) {
    const { stack } = await provider.get("test_slice_int", [
      {
        type: "slice",
        cell:
          typeof data == "string"
            ? createBuilderFromString(data).asCell()
            : data,
      },
      {
        type: "int",
        value: BigInt(bitLength),
      },
    ]);

    return { remainingSlice: stack.readCell(), value: stack.readBigNumber() };
  }

  async getTestParseDataPackage(provider: ContractProvider, data: string) {
    const { stack } = await provider.get("test_parse_data_package", [
      {
        type: "slice",
        cell: createBuilderFromString(data).asCell(),
      },
    ]);

    return {
      feedId: stack.readBigNumber(),
      value: stack.readBigNumber(),
      timestamp: stack.readNumber(),
    };
  }

  async getTestTupleDeserializeIntegers(
    provider: ContractProvider,
    numbers: (number | string)[]
  ) {
    const { stack } = await provider.get("test_tuple_deserialize_integers", [
      {
        type: "cell",
        cell: serializeTuple(createTupleItems(numbers)),
      },
    ]);

    return createArrayFromTuple(stack.readTuple());
  }
}
