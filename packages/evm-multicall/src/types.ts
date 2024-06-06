import { Contract } from "ethers";

export interface Call3 {
  address: string;
  allowFailure: boolean;
  callData: string;
}

export interface Call3Value {
  target: string;
  allowFailure: boolean;
  value: string;
  callData: string;
}

export interface Result {
  success: boolean;
  returnData: string;
}

export interface Multicall3 extends Contract {
  aggregate3(calls: Call3[]): Promise<Result>;
}

export interface RedstoneCall3 extends Call3 {
  gasLimit: number;
}

export interface RedstoneMulticall3 extends Contract {
  aggregate3(calls: RedstoneCall3[]): Promise<Result>;
}
