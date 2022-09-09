import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from "@nestjs/common";
import { DataPackagesRequestParams } from "redstone-sdk";
import config from "../config";
import { ReceivedDataPackage } from "./data-packages.interface";
import { DataPackagesService } from "./data-packages.service";
import { CachedDataPackage } from "./data-packages.model";
import { BundlrService } from "../bundlr/bundlr.service";

export interface BulkPostRequestBody {
  requestSignature: string;
  dataPackages: ReceivedDataPackage[];
}

export interface GetLatestDataPackagesQuery {
  "data-service-id": string;
  "unique-signers-count": number;
  "data-feeds": string;
}

export interface DataPackagesResponse {
  [dataFeedId: string]: CachedDataPackage[];
}

@Controller("data-packages")
export class DataPackagesController {
  private bundlrService = new BundlrService();

  constructor(private dataPackagesService: DataPackagesService) {}

  @Get("latest")
  async getLatest(
    @Query() query: GetLatestDataPackagesQuery
  ): Promise<DataPackagesResponse> {
    // TODO: implement request validation
    const requestParams: DataPackagesRequestParams = {
      dataServiceId: query["data-service-id"],
      uniqueSignersCount: query["unique-signers-count"],
      dataFeeds: (query["data-feeds"] ?? "").split(","),
    };

    return await this.dataPackagesService.getDataPackages(requestParams);
  }

  @Post("bulk")
  async addBulk(@Body() body: BulkPostRequestBody) {
    if (!config.enableDirectPostingRoutes) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: "Data package posting routes are disabled",
        },
        HttpStatus.BAD_REQUEST
      );
    }

    // TODO: implement request validation
    // TODO: implement request size limit

    const signerAddress = await this.dataPackagesService.verifyRequester(body);

    const dataPackagesToSave =
      await this.dataPackagesService.prepareReceivedDataPackagesForBulkSaving(
        body.dataPackages,
        signerAddress
      );

    await this.dataPackagesService.saveManyDataPackagesInDB(dataPackagesToSave);

    if (config.enableArchivingOnArweave) {
      await this.bundlrService.safelySaveDataPackages(dataPackagesToSave);
    }
  }
}
