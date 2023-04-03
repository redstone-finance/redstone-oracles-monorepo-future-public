import {
  ContractParamsProvider,
  DataPackagesRequestParams,
} from "redstone-sdk";

export class StarknetContractParamsProvider extends ContractParamsProvider {
  protected override async requestPayload(
    requestParams: DataPackagesRequestParams
  ): Promise<string> {
    let requestParamsChanged = { ...requestParams };
    requestParamsChanged["dataFeeds"] = undefined;

    return await super.requestPayload(requestParamsChanged);
  }
}
