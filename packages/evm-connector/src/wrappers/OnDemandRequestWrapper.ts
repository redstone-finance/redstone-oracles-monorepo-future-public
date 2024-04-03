import {
  ScoreType,
  SignedDataPackage,
  SignedDataPackagePlainObj,
  UniversalSigner,
  prepareMessageToSign,
} from "@redstone-finance/protocol";
import axios from "axios";
import { Contract, Signer } from "ethers";
import { version } from "../../package.json";
import { BaseWrapper } from "./BaseWrapper";

export interface OnDemandRequestParams {
  signer: Signer;
  scoreType: ScoreType;
}

export class OnDemandRequestWrapper<T extends Contract> extends BaseWrapper<T> {
  constructor(
    private readonly requestParams: OnDemandRequestParams,
    private readonly nodeUrls: string[]
  ) {
    super();
  }

  override getUnsignedMetadata(): string {
    return `${version}#on-demand-request`;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this, @typescript-eslint/require-await
  async dryRunToVerifyPayload(payloads: string[]): Promise<string> {
    return payloads[0];
  }

  override async getDataPackagesForPayload(): Promise<SignedDataPackage[]> {
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
