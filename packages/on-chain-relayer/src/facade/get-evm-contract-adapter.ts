import { Provider } from "@ethersproject/providers";
import { Contract, Signer } from "ethers";
import { abi as redstoneAdapterABI } from "../../artifacts/contracts/core/RedstoneAdapterBase.sol/RedstoneAdapterBase.json";
import { abi as mentoAdapterABI } from "../../artifacts/contracts/custom-integrations/mento/MentoAdapterBase.sol/MentoAdapterBase.json";
import { abi as multifeedAdapterABI } from "../../artifacts/contracts/price-feeds/without-rounds/MultiFeedAdapterWithoutRounds.sol/MultiFeedAdapterWithoutRounds.json";
import {
  MentoAdapterBase,
  MultiFeedAdapterWithoutRounds,
  RedstoneAdapterBase,
} from "../../typechain-types";
import { EvmContractAdapter } from "../core/contract-interactions/EvmContractAdapter";
import { MentoEvmContractAdapter } from "../core/contract-interactions/MentoEvmContractAdapter";
import { MultiFeedEvmContractAdapter } from "../core/contract-interactions/MultiFeedEvmContractAdapter";
import { PriceFeedsEvmContractAdapter } from "../core/contract-interactions/PriceFeedsEvmContractAdapter";
import { ITxDeliveryMan } from "../core/contract-interactions/tx-delivery-gelato-fixes";
import { RelayerConfig } from "../types";
import { RedstoneEvmContract } from "./EvmContractFacade";

export function getEvmContractAdapter(
  relayerConfig: RelayerConfig,
  signerOrProvider?: Signer | Provider,
  txDeliveryMan?: ITxDeliveryMan,
  // especially for gelato
  priceFeedsEvmContractAdapterOverride?: (
    contract: RedstoneAdapterBase,
    txDeliveryMan?: ITxDeliveryMan
  ) => PriceFeedsEvmContractAdapter<RedstoneAdapterBase>
): EvmContractAdapter<RedstoneEvmContract> {
  const { adapterContractAddress } = relayerConfig;

  switch (relayerConfig.adapterContractType) {
    case "multi-feed": {
      const multiFeedContract = new Contract(
        adapterContractAddress,
        multifeedAdapterABI,
        signerOrProvider
      ) as MultiFeedAdapterWithoutRounds;

      return new MultiFeedEvmContractAdapter(multiFeedContract, txDeliveryMan);
    }

    case "price-feeds": {
      const contract = new Contract(
        adapterContractAddress,
        redstoneAdapterABI,
        signerOrProvider
      ) as RedstoneAdapterBase;

      if (priceFeedsEvmContractAdapterOverride) {
        return priceFeedsEvmContractAdapterOverride(contract, txDeliveryMan);
      }

      return new PriceFeedsEvmContractAdapter(contract, txDeliveryMan);
    }

    case "mento": {
      const mentoContract = new Contract(
        adapterContractAddress,
        mentoAdapterABI,
        signerOrProvider
      ) as MentoAdapterBase;

      return new MentoEvmContractAdapter(mentoContract, txDeliveryMan);
    }

    default:
      throw new Error(
        `adapterContractType ${relayerConfig.adapterContractType} is not supported`
      );
  }
}
