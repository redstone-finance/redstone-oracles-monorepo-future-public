import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { DataPackagesRequestParams } from "redstone-sdk";
import config from "../config";
import { ReceivedDataPackage } from "./data-packages.interface";
import { DataPackagesService } from "./data-packages.service";
import { CachedDataPackage } from "./data-packages.model";
import { BundlrService } from "../bundlr/bundlr.service";
import type { Response } from "express";
import { duplexStream } from "../utils/streams";
import { Serializable } from "redstone-protocol";

export interface BulkPostRequestBody {
  requestSignature: string;
  dataPackages: ReceivedDataPackage[];
}

export type ResponseFormat = "raw" | "hex";

export interface GetLatestDataPackagesQuery {
  "data-service-id": string;
  "unique-signers-count": number;
  "data-feeds": string;
  format?: ResponseFormat;
}

export interface GetDataPackagesStatsQuery {
  "from-timestamp": string;
  "to-timestamp"?: string;
  "api-key": string;
}

export interface DataPackagesResponse {
  [dataFeedId: string]: CachedDataPackage[];
}

export interface DataPackagesStatsResponse {
  [signerAddress: string]: {
    dataPackagesCount: number;
    nodeName: string;
    dataServiceId: string;
  };
}

const CONTENT_TYPE_OCTET_STREAM = "application/octet-stream";
const CONTENT_TYPE_TEXT = "text/html";

@Controller("data-packages")
export class DataPackagesController {
  private bundlrService = new BundlrService();

  constructor(private dataPackagesService: DataPackagesService) {}

  private prepareDataPackagesRequestParams(
    query: GetLatestDataPackagesQuery
  ): DataPackagesRequestParams {
    // TODO: implement request validation

    const requestParams: DataPackagesRequestParams = {
      dataServiceId: query["data-service-id"],
      uniqueSignersCount: query["unique-signers-count"],
    };

    if (query["data-feeds"]) {
      requestParams.dataFeeds = query["data-feeds"].split(",");
    }
    return requestParams;
  }

  @Get("latest")
  async getLatest(
    @Query() query: GetLatestDataPackagesQuery
  ): Promise<DataPackagesResponse> {
    return await this.dataPackagesService.getDataPackages(
      this.prepareDataPackagesRequestParams(query)
    );
  }

  @Get("payload")
  async getPayload(
    @Query() query: GetLatestDataPackagesQuery,
    @Res() res: Response
  ) {
    const payload = await this.dataPackagesService.getPayload(
      this.prepareDataPackagesRequestParams(query)
    );
    this.sendSerializableResponse(res, payload, query.format);
  }

  @Get("stats")
  async getStats(
    @Query() query: GetDataPackagesStatsQuery
  ): Promise<DataPackagesStatsResponse> {
    if (query["api-key"] !== config.apiKeyForAccessToAdminRoutes) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: "Incorrect api-key query param",
        },
        HttpStatus.UNAUTHORIZED
      );
    }

    return await this.dataPackagesService.getDataPackagesStats({
      fromTimestamp: Number(query["from-timestamp"]),
      toTimestamp: Number(query["to-timestamp"] || Date.now()),
    });
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

    const signerAddress = this.dataPackagesService.verifyRequester(body);

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

  private sendSerializableResponse(
    res: Response,
    data: Serializable,
    format?: ResponseFormat
  ) {
    switch (format || "raw") {
      case "hex":
        res.contentType(CONTENT_TYPE_TEXT);
        res.send(data.toBytesHex());
        return;

      case "raw":
        res.contentType(CONTENT_TYPE_OCTET_STREAM);
        duplexStream(data.toBytes()).pipe(res);
        return;

      default:
        throw new Error(`Unsupported format: '${format}'`);
    }
  }
}
