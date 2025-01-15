import {
  Controller,
  Get,
  Header,
  Param,
  ServiceUnavailableException,
} from "@nestjs/common";
import config from "../config";
import { BaseDataPackagesController } from "./base-data-packages.controller";
import { DataPackagesResponse } from "./data-packages.interface";
import { DataPackagesService } from "./data-packages.service";

@Controller("v2/data-packages")
export class DataPackagesControllerV2 extends BaseDataPackagesController {
  protected readonly allowExternalSigners = true;

  @Get("latest/:DATA_SERVICE_ID/hide-metadata")
  @Header("Cache-Control", "max-age=5")
  async getAllLatestWithNoMetadata(
    @Param("DATA_SERVICE_ID") dataServiceId: string
  ): Promise<DataPackagesResponse> {
    await BaseDataPackagesController.validateDataServiceId(dataServiceId);
    return await this.dataPackagesService.getLatestDataPackagesWithSameTimestampWithCache(
      dataServiceId,
      true,
      this.allowExternalSigners
    );
  }

  @Get("historical/:DATA_SERVICE_ID/:TIMESTAMP/hide-metadata")
  @Header("Cache-Control", "max-age=5")
  async getDataPackagesByTimestampWithNoMetadata(
    @Param("DATA_SERVICE_ID") dataServiceId: string,
    @Param("TIMESTAMP") timestamp: string
  ): Promise<DataPackagesResponse> {
    if (!config.enableHistoricalDataServing) {
      throw new ServiceUnavailableException(
        `historical/* routes are not enabled in this cache-service configuration`
      );
    }
    await DataPackagesControllerV2.validateDataServiceId(dataServiceId);

    return await DataPackagesService.getDataPackagesByTimestamp(
      dataServiceId,
      Number(timestamp),
      true,
      this.allowExternalSigners
    );
  }
}
