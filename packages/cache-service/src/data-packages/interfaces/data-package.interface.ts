// TODO: Maybe we will use interfcaes from redstone-protocol instead

import { DataPoint } from "./data-point.interface";

export interface DataPackage {
  timestamp: number;
  signature: string;
  signerEvmAddress: string;
  symbol?: string; // Will be set only for data packages with a single data point
  dataPoints: DataPoint[];
}
