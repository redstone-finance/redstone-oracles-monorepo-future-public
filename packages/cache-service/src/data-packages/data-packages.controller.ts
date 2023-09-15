import {
  Body,
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  ServiceUnavailableException,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import type { Response } from "express";
import { Serializable } from "@redstone-finance/protocol";
import { DataPackagesRequestParams } from "@redstone-finance/sdk";
import config from "../config";
import { duplexStream } from "../utils/streams";
import {
  BulkPostRequestBody,
  DataPackagesResponse,
  DataPackagesStatsResponse,
  GetDataPackagesStatsQuery,
  GetLatestDataPackagesQuery,
  ResponseFormat,
} from "./data-packages.interface";
import { DataPackagesService } from "./data-packages.service";

const CONTENT_TYPE_OCTET_STREAM = "application/octet-stream";
const CONTENT_TYPE_TEXT = "text/html";
const CONTENT_TYPE_JSON = "application/json";

@Controller("data-packages")
@UsePipes(new ValidationPipe({ transform: true }))
export class DataPackagesController {
  constructor(private dataPackagesService: DataPackagesService) {}

  private static prepareDataPackagesRequestParams(
    query: GetLatestDataPackagesQuery
  ): DataPackagesRequestParams {
    // TODO: implement request validation

    const requestParams: DataPackagesRequestParams = {
      dataServiceId: query["data-service-id"],
      uniqueSignersCount: Number(query["unique-signers-count"]),
    };

    if (query["data-feeds"]) {
      requestParams.dataFeeds = query["data-feeds"].split(",");
    }
    return requestParams;
  }

  private static async validateDataServiceId(dataServiceId: string) {
    const isDataServiceIdValid =
      await DataPackagesService.isDataServiceIdValid(dataServiceId);
    if (!isDataServiceIdValid) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: "Data service id is invalid",
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get("latest/:DATA_SERVICE_ID")
  @Header("Cache-Control", "max-age=5")
  async getAllLatest(
    @Param("DATA_SERVICE_ID") dataServiceId: string
  ): Promise<DataPackagesResponse> {
    await DataPackagesController.validateDataServiceId(dataServiceId);
    return await this.dataPackagesService.getLatestDataPackagesWithSameTimestampWithCache(
      dataServiceId
    );
  }

  @Get("latest-not-aligned-by-time/:DATA_SERVICE_ID")
  @Header("Cache-Control", "max-age=5")
  async getMostRecent(
    @Param("DATA_SERVICE_ID") dataServiceId: string
  ): Promise<DataPackagesResponse> {
    await DataPackagesController.validateDataServiceId(dataServiceId);
    return await this.dataPackagesService.getMostRecentDataPackagesWithCache(
      dataServiceId
    );
  }

  @Get("historical/:DATA_SERVICE_ID/:TIMESTAMP")
  @Header("Cache-Control", "max-age=5")
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async getByTimestamp(
    @Param("DATA_SERVICE_ID") dataServiceId: string,
    @Param("TIMESTAMP") timestamp: string
  ): Promise<DataPackagesResponse> {
    if (!config.enableHistoricalDataServing) {
      throw new ServiceUnavailableException(
        `historical/* routes are not enabled in this cache-service configuration`
      );
    }
    await DataPackagesController.validateDataServiceId(dataServiceId);

    return await DataPackagesService.getByTimestamp(
      dataServiceId,
      Number(timestamp)
    );
  }

  @Get("latest")
  @Header("Cache-Control", "max-age=5")
  async getLatest(@Query() query: GetLatestDataPackagesQuery) {
    return await this.dataPackagesService.queryLatestDataPackages(
      DataPackagesController.prepareDataPackagesRequestParams(query)
    );
  }

  @Get("payload")
  async getPayload(
    @Query() query: GetLatestDataPackagesQuery,
    @Res() res: Response
  ) {
    const payload = await this.dataPackagesService.getPayload(
      DataPackagesController.prepareDataPackagesRequestParams(query)
    );
    DataPackagesController.sendSerializableResponse(res, payload, query.format);
  }

  @Get("stats/:PERIOD")
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async getStats(
    @Query() query: GetDataPackagesStatsQuery,
    @Param("PERIOD") period: string
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

    const now = Date.now();
    return await DataPackagesService.getDataPackagesStats({
      fromTimestamp: now - Number(period),
      toTimestamp: now,
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

    const signerAddress = DataPackagesService.verifyRequester(body);

    const dataPackagesToSave =
      await DataPackagesService.prepareReceivedDataPackagesForBulkSaving(
        body.dataPackages,
        signerAddress
      );

    await this.dataPackagesService.saveMany(dataPackagesToSave, signerAddress);
  }

  private static sendSerializableResponse(
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

      case "bytes":
        res.contentType(CONTENT_TYPE_JSON);
        res.send(Array.from(data.toBytes()));
        return;

      case "json":
        res.contentType(CONTENT_TYPE_JSON);
        res.send(data);
        return;

      default:
        throw new Error(`Unsupported format: '${format}'`);
    }
  }
}
