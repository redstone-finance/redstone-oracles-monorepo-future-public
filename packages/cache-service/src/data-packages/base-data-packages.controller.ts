import {
  Body,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  ServiceUnavailableException,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import config from "../config";
import {
  BulkPostRequestBody,
  DataPackagesResponse,
  DataPackagesStatsResponse,
  GetDataPackagesStatsQuery,
} from "./data-packages.interface";
import { DataPackagesService } from "./data-packages.service";

@UsePipes(new ValidationPipe({ transform: true }))
export abstract class BaseDataPackagesController {
  constructor(protected readonly dataPackagesService: DataPackagesService) {}

  protected abstract readonly allowExternalSigners: boolean;

  protected static async validateDataServiceId(dataServiceId: string) {
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
    await BaseDataPackagesController.validateDataServiceId(dataServiceId);
    return await this.dataPackagesService.getLatestDataPackagesWithSameTimestampWithCache(
      dataServiceId,
      false,
      this.allowExternalSigners
    );
  }

  @Get("latest-not-aligned-by-time/:DATA_SERVICE_ID")
  @Header("Cache-Control", "max-age=5")
  async getMostRecent(
    @Param("DATA_SERVICE_ID") dataServiceId: string
  ): Promise<DataPackagesResponse> {
    await BaseDataPackagesController.validateDataServiceId(dataServiceId);
    return await this.dataPackagesService.getLatestDataPackagesWithCache(
      dataServiceId,
      false,
      this.allowExternalSigners
    );
  }

  @Get("historical/:DATA_SERVICE_ID/:TIMESTAMP")
  @Header("Cache-Control", "max-age=5")
  async getDataPackagesByTimestamp(
    @Param("DATA_SERVICE_ID") dataServiceId: string,
    @Param("TIMESTAMP") timestamp: string
  ): Promise<DataPackagesResponse> {
    if (!config.enableHistoricalDataServing) {
      throw new ServiceUnavailableException(
        `historical/* routes are not enabled in this cache-service configuration`
      );
    }
    await BaseDataPackagesController.validateDataServiceId(dataServiceId);

    return await DataPackagesService.getDataPackagesByTimestamp(
      dataServiceId,
      Number(timestamp),
      false,
      this.allowExternalSigners
    );
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

    this.dataPackagesService
      .broadcast(dataPackagesToSave, signerAddress)
      .catch(() => {}); // ignore errors as they are logged by the service
  }
}
