import { IContractFacade } from "../facade/IContractFacade";
import { RelayerConfig } from "../types";

export async function getIterationArgsBase(
  contractFacade: IContractFacade,
  relayerConfig: RelayerConfig
) {
  const blockTag = await contractFacade.getBlockNumber();
  const [uniqueSignersThreshold, dataFromContract] = await Promise.all([
    contractFacade.getUniqueSignersThresholdFromContract(blockTag),
    contractFacade.getLastRoundParamsFromContract(blockTag, relayerConfig),
  ]);
  return { blockTag, uniqueSignersThreshold, dataFromContract };
}
