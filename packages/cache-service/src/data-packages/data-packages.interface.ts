import {
  DataPointPlainObj,
  SignedDataPackagePlainObj,
} from "@redstone-finance/protocol";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidateNested,
} from "class-validator";
import { IsNumberOrString } from "../utils/IsNumberOrString";
import { CachedDataPackage } from "./data-packages.model";

export class ReceivedDataPackage implements SignedDataPackagePlainObj {
  @IsString()
  signature!: string;

  @ValidateNested({ each: true })
  @Type(() => ReceivedDataPoint)
  dataPoints!: DataPointPlainObj[];

  @IsString()
  timestampMilliseconds!: number;

  @IsOptional()
  sources?: Record<string, string | number>;

  dataPackageId!: string;
}

export class ReceivedDataPoint {
  @IsString()
  dataFeedId!: string;

  @Validate(IsNumberOrString)
  value!: string | number;
}

export class BulkPostRequestBody {
  @IsString()
  @Matches(/^0x[0-9A-Fa-f]*$/)
  @MinLength(132)
  @MaxLength(132)
  requestSignature!: string;

  @ValidateNested({ each: true })
  dataPackages!: ReceivedDataPackage[];
}

export type ResponseFormat = "raw" | "hex" | "bytes" | "json";

export class GetLatestDataPackagesQuery {
  @IsString()
  "data-service-id": string;

  @IsString()
  "unique-signers-count": string;

  @IsString()
  @IsOptional()
  "data-feeds"?: string;

  @IsOptional()
  @IsEnum(["raw", "hex", "bytes", "json"])
  format?: ResponseFormat;
}

export class GetDataPackagesStatsQuery {
  @IsString()
  "api-key": string;
}

export interface DataPackagesResponse {
  [dataPackageId: string]: CachedDataPackage[] | undefined;
}

export interface DataPackagesStatsResponse {
  [signerAddress: string]: {
    verifiedDataPackagesCount: number;
    nodeName: string;
    dataServiceId: string;
  };
}
