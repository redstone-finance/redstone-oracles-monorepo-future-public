import {
  MentoAdapterBase,
  MultiFeedAdapterWithoutRounds,
  RedstoneAdapterBase,
} from "../../typechain-types";
import { RelayerConfig } from "../config/RelayerConfig";
import { EvmContractAdapter } from "../core/contract-interactions/EvmContractAdapter";
import { MentoEvmContractAdapter } from "../core/contract-interactions/MentoEvmContractAdapter";
import { MultiFeedEvmContractAdapter } from "../core/contract-interactions/MultiFeedEvmContractAdapter";
import { PriceFeedsEvmContractAdapter } from "../core/contract-interactions/PriceFeedsEvmContractAdapter";
import { ITxDeliveryMan } from "../core/contract-interactions/tx-delivery-gelato-bypass";
import { RedstoneEvmContract } from "./EvmContractFacade";

export function getEvmContractAdapter(
  relayerConfig: RelayerConfig,
  adapterContract: RedstoneEvmContract,
  txDeliveryMan?: ITxDeliveryMan
): EvmContractAdapter<RedstoneEvmContract> {
  switch (relayerConfig.adapterContractType) {
    case "multi-feed": {
      return new MultiFeedEvmContractAdapter(
        relayerConfig,
        adapterContract as MultiFeedAdapterWithoutRounds,
        txDeliveryMan
      );
    }

    case "price-feeds": {
      return new PriceFeedsEvmContractAdapter(
        relayerConfig,
        adapterContract as RedstoneAdapterBase,
        txDeliveryMan
      );
    }

    case "mento": {
      return new MentoEvmContractAdapter(
        relayerConfig,
        adapterContract as MentoAdapterBase,
        txDeliveryMan
      );
    }

    default:
      throw new Error(
        `adapterContractType ${relayerConfig.adapterContractType} is not supported`
      );
  }
}
