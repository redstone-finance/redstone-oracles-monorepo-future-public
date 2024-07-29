import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { DataPointPlainObj } from "@redstone-finance/protocol";
import mongoose, { Document } from "mongoose";
import config from "../config";

const { Types } = mongoose.Schema;

export type DataPackageDocument = CachedDataPackage &
  Document<{ dataPackageId: string; signerAddress: string }>;

export type DataPackageDocumentMostRecentAggregated = {
  _id: { signerAddress: string; dataPackageId: string };
  timestampMilliseconds: Date;
  signature: string;
  dataPoints: DataPointPlainObj[];
  dataServiceId: string;
  dataPackageId: string;
  isSignatureValid: boolean;
};

export type DataPackageDocumentAggregated = {
  count: number;
  _id: { timestampMilliseconds: Date };
  signatures: string[];
  dataPoints: DataPointPlainObj[][];
  dataPackageIds: string[];
  signerAddress: string[];
  isSignatureValid: boolean[];
};

@Schema({
  autoIndex: true,
  toJSON: { virtuals: false, getters: true },
  toObject: { virtuals: false, getters: true },
})
export class CachedDataPackage {
  @Prop({
    type: Types.Date,
    required: true,
    get: (value: Date) => value.getTime(),
    set: (value: number) => new Date(value),
  })
  timestampMilliseconds!: number;

  @Prop({ required: true })
  signature!: string;

  @Prop({ required: true })
  isSignatureValid!: boolean;

  @Prop({ type: Types.Mixed, required: true })
  dataPoints!: DataPointPlainObj[];

  @Prop({ required: true })
  dataServiceId!: string;

  @Prop({ required: true })
  signerAddress!: string;

  @Prop({ required: true })
  dataPackageId!: string;
}

export const DataPackageSchema =
  SchemaFactory.createForClass(CachedDataPackage);

// Creating a compound mongoDB index to improve performance of the queries
DataPackageSchema.index({
  dataServiceId: 1,
  dataPackageId: 1,
  signerAddress: 1,
  timestampMilliseconds: -1,
});

DataPackageSchema.index(
  {
    timestampMilliseconds: -1,
  },
  { expireAfterSeconds: config.mongoDbTTLSeconds }
);

mongoose.set("strictQuery", true);

export const DataPackage = mongoose.model("DataPackage", DataPackageSchema);
