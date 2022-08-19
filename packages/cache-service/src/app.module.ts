import { Module, Provider } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { DataPackagesController } from "./data-packages/data-packages.controller";
import { DataPackagesService } from "./data-packages/data-packages.service";
import { OracleRegistryStateController } from "./oracle-registry-state/oracle-registry-state.controller";
import { DataFeedsMetadataController } from "./data-feeds-metadata/data-feeds-metadata.controller";
import config from "./config";
import { StreamrListenerService } from "./streamr-listener/streamr-listener.service";

const providers: Provider[] = [DataPackagesService];
const imports = [];

if (config.enableStreamrListening) {
  providers.push(StreamrListenerService);
  imports.push(ScheduleModule.forRoot());
}

if (config.mongoDbUrl) {
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
