import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { DataPackagesController } from "./data-packages/data-packages.controller";
import { DataPackagesService } from "./data-packages/data-packages.service";
import { OracleRegistryStateController } from "./oracle-registry-state/oracle-registry-state.controller";
import { SymbolsMetadataController } from "./symbols-metadata/symbols-metadata.controller";

@Module({
  imports: [],
  controllers: [
    AppController,
    DataPackagesController,
    OracleRegistryStateController,
    SymbolsMetadataController,
  ],
  providers: [DataPackagesService],
})
export class AppModule {}
