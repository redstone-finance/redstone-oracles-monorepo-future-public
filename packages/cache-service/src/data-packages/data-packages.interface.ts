import { SignedDataPackagePlainObj } from "redstone-protocol";

export interface ReceivedDataPackage extends SignedDataPackagePlainObj {
  sources?: object;
}
