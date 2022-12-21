import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { DataPointPlainObj } from "redstone-protocol";

const { Types } = mongoose.Schema;

export type DataPackageDocument = CachedDataPackage & Document;

@Schema({ autoIndex: true })
export class CachedDataPackage {
  @Prop({ required: true })
  timestampMilliseconds: number;

  @Prop({ required: true })
  signature: string;

  @Prop({ required: true })
  isSignatureValid: boolean;

  @Prop({ type: Types.Mixed, required: true })
  dataPoints: DataPointPlainObj[];

  @Prop({ required: true })
  dataServiceId: string;

  @Prop({ required: true })
  signerAddress: string;

  @Prop({ required: false })
  dataFeedId?: string;

  @Prop({ type: Types.Mixed, required: false })
  sources?: object;
}

export const DataPackageSchema =
  SchemaFactory.createForClass(CachedDataPackage);

// Creating a compound mongoDB index to improve performance of the queries
DataPackageSchema.index({
  dataServiceId: 1,
  dataFeedId: 1,
  signerAddress: 1,
  timestampMilliseconds: -1,
});

export const DataPackage = mongoose.model("DataPackage", DataPackageSchema);
