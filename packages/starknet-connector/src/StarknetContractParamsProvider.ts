import {
  ContractParamsProvider,
  DataPackagesRequestParams,
} from "redstone-sdk";

export class StarknetContractParamsProvider extends ContractParamsProvider {
  protected override async requestPayload(
    requestParams: DataPackagesRequestParams
  ): Promise<string> {
    const changedRequestParams = { ...requestParams };
    changedRequestParams["dataFeeds"] = undefined;

    return await super.requestPayload(changedRequestParams);
  }
}
