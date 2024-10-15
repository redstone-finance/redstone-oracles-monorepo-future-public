import { config } from "../../config";
import { MultiFeedUpdatePricesArgs } from "../../types";
import { includeFeedsCloseToDeviation } from "./feeds-close-to-devation";
import { includeSynchronizedHeartbeatUpdates } from "./heartbeat-sync";

export const addExtraFeedsToUpdateParams = (
  args: MultiFeedUpdatePricesArgs
) => {
  const relayerConfig = config();
  const { dataFeedsToUpdate, dataFeedsDeviationRatios, heartbeatUpdates } =
    args;
  const dataFeedsToUpdateLengthOld = dataFeedsToUpdate.length;
  const { message: deviationMessage } = includeFeedsCloseToDeviation(
    dataFeedsToUpdate,
    dataFeedsDeviationRatios,
    relayerConfig
  );
  const { message: heartbeatMessage } = includeSynchronizedHeartbeatUpdates(
    dataFeedsToUpdate,
    heartbeatUpdates,
    relayerConfig
  );
  const message =
    dataFeedsToUpdateLengthOld < dataFeedsToUpdate.length
      ? "Additional feeds included in the update to optimize gas: " +
        deviationMessage +
        "\n" +
        heartbeatMessage
      : "No additional feeds were included in the update.";
  return message;
};
