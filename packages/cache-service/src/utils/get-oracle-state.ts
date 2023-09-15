import { getOracleRegistryState } from "@redstone-finance/sdk";
import config from "../config";
import { mockOraclesState } from "../oracle-registry-state/mock-oracle-registry-state";

export const getOracleState = async () => {
  // Mock oracle state is used in monorepo integration tests
  return config.useMockOracleRegistryState
    ? mockOraclesState
    : await getOracleRegistryState();
};
