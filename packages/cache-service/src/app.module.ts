import config from "./config";
import mongoose from "mongoose";
import { Module, Provider } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { MongooseModule } from "@nestjs/mongoose";
import { LoggerModule } from "nestjs-pino";
import { AppController } from "./app.controller";
import { DataPackagesController } from "./data-packages/data-packages.controller";
import { DataPackagesService } from "./data-packages/data-packages.service";
import { OracleRegistryStateController } from "./oracle-registry-state/oracle-registry-state.controller";
import { DataFeedsMetadataController } from "./data-feeds-metadata/data-feeds-metadata.controller";
import { StreamrListenerService } from "./streamr-listener/streamr-listener.service";
import { BundlrService } from "./bundlr/bundlr.service";

const providers: Provider[] = [DataPackagesService, BundlrService];
const imports = [LoggerModule.forRoot()];

if (config.enableStreamrListening) {
  providers.push(StreamrListenerService);
  imports.push(ScheduleModule.forRoot());
}

if (config.mongoDbUrl) {
  mongoose.connect(config.mongoDbUrl);
  imports.push(MongooseModule.forRoot(config.mongoDbUrl));
}

@Module({
  imports,
  controllers: [
    AppController,
    DataPackagesController,
    OracleRegistryStateController,
    DataFeedsMetadataController,
  ],
  providers,
})
export class AppModule {}
