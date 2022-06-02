import { DataPackage } from "redstone-protocol";
import { BaseWrapper } from "./BaseWrapper";

export class DataFeedWrapper extends BaseWrapper {
  constructor(private mockDataPackage: DataPackage) {
    super();
  }

  async getBytesDataForAppending(): Promise<string> {
    throw 1;
  }
}
