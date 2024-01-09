import { Module, Provider } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import mongoose from "mongoose";
import { LoggerModule } from "nestjs-pino";
import { AppController } from "./app.controller";
import { MongoBroadcaster } from "./broadcasters/mongo-broadcaster";
import { StreamrBroadcaster } from "./broadcasters/streamr-broadcaster";
import config from "./config";
import { DataFeedsMetadataController } from "./data-feeds-metadata/data-feeds-metadata.controller";
import { DataPackagesController } from "./data-packages/data-packages.controller";
import { DataPackagesService } from "./data-packages/data-packages.service";
import { OracleRegistryStateController } from "./oracle-registry-state/oracle-registry-state.controller";
import { StreamrListenerService } from "./streamr-listener/streamr-listener.service";

const providers: Provider[] = [DataPackagesService];
const imports = [LoggerModule.forRoot()];

if (config.enableStreamrListening) {
  providers.push(StreamrListenerService);
  imports.push(ScheduleModule.forRoot());
}

if (config.streamrPrivateKey) {
  providers.push(StreamrBroadcaster);
}

if (config.mongoDbUrl) {
  providers.push(MongoBroadcaster);
  if (config.mongoDbUrl !== "MOCK_MONGO_URL") {
    void mongoose.connect(config.mongoDbUrl);
    imports.push(MongooseModule.forRoot(config.mongoDbUrl));
  }
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
