import axios from "axios";
import { Signer } from "ethers";
import {
  SignedDataPackage,
  SignedDataPackagePlainObj,
  ScoreType,
  UniversalSigner,
  prepareMessageToSign,
} from "redstone-protocol";
import { BaseWrapper } from "./BaseWrapper";
import { version } from "../../package.json";

export interface OnDemandRequestParams {
  signer: Signer;
  scoreType: ScoreType;
}

export class OnDemandRequestWrapper extends BaseWrapper {
  constructor(
    private readonly requestParams: OnDemandRequestParams,
    private readonly nodeUrls: string[]
  ) {
    super();
  }

  getUnsignedMetadata(): string {
    return `${version}#on-demand-request`;
  }

  async dryRunToVerifyPayload(payloads: string[]): Promise<string> {
    return payloads[0];
  }

  async getDataPackagesForPayload(): Promise<SignedDataPackage[]> {
    const timestamp = Date.now();
    const message = prepareMessageToSign(timestamp);
    const { signer, scoreType } = this.requestParams;
    const signature = await UniversalSigner.signWithEthereumHashMessage(
      signer,
      message
    );
    const promises = this.nodeUrls.map((url) =>
      axios.get(url, {
        params: { timestamp, signature, scoreType },
      })
    );
    const responses = await Promise.all(promises);
    const signedDataPackages = responses.map((response) =>
      SignedDataPackage.fromObj(response.data as SignedDataPackagePlainObj)
    );

    return signedDataPackages;
  }
}
