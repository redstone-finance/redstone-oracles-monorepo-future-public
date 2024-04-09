import * as multicall3 from "../artifacts/contracts/Mulitcall3.sol/Multicall3.json";
import * as redstoneMulticall3 from "../artifacts/contracts/RedstoneMulitcall3.sol/RedstoneMulticall3.json";

export const Multicall3Abi = multicall3.abi;
export const Multicall3ByteCode = multicall3.bytecode;

export const RedstoneMulticall3Abi = redstoneMulticall3.abi;
export const RedstoneMulticall3ByteCode = redstoneMulticall3.bytecode;

export type * as EvmMulticallTypes from "./types";
