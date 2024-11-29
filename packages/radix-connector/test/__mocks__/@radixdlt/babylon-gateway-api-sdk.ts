import {
  getCurrent,
  getEntityDetailsVaultAggregated,
  transactionCommittedDetails,
  transactionStatus,
  transactionSubmit,
} from "../transactions";

export = {
  GatewayApiClient: {
    initialize: jest.fn().mockImplementation(() => ({
      transaction: {
        innerClient: {
          transactionCommittedDetails,
          transactionSubmit,
          transactionStatus,
        },
      },
      status: {
        getCurrent,
      },
      state: {
        getEntityDetailsVaultAggregated,
      },
    })),
  },
};
