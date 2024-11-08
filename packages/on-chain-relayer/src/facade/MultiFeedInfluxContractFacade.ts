import { DataPackagesResponseCache } from "@redstone-finance/sdk";
import {
  MultiFeedAdapterWithoutRounds,
  MultiFeedEvmContractFacade,
} from "../index";
import { RelayerConfig } from "../types";
import { RelayerDataInfluxService } from "./RelayerDataInfluxService";

const RELAYER_DATA_BUCKET = "dry-run-relayer-data";

export class MultiFeedInfluxContractFacade extends MultiFeedEvmContractFacade {
  constructor(
    contract: MultiFeedAdapterWithoutRounds,
    relayerConfig: RelayerConfig,
    cache?: DataPackagesResponseCache
  ) {
    const { influxUrl, influxToken } = relayerConfig;

    const influxService = new RelayerDataInfluxService({
      url: influxUrl!,
      token: influxToken!,
      bucketName: RELAYER_DATA_BUCKET,
      orgName: "redstone",
    });

    super(contract, (args) => influxService.updatePriceValues(args), cache);
  }
}
