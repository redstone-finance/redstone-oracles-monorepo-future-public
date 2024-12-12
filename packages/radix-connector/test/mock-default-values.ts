import {
  getCurrent,
  getEntityDetailsVaultAggregated,
  transactionCommittedDetails,
  transactionStatus,
  transactionSubmit,
} from "./__mocks__/transactions";
import STATE_MOCK from "./mock_data/state_mock.json";

const TRANSACTION_STATUS_MOCK = { intent_status: "CommittedSuccess" };
const TRANSACTION_SUBMIT_MOCK = { duplicate: false };
const TRANSACTION_COMMITTED_DETAILS_MOCK = transactionCommittedDetailsMock([
  "5c2100",
  "5c21020a70832194910100002020020a04c06310cb3c0000000000000000000000000000000000000000000000000000000a0410a9e1b5a9050000000000000000000000000000000000000000000000000000",
  "5c2100",
]);

export function mockDefaultValues() {
  getEntityDetailsVaultAggregated.mockResolvedValue(STATE_MOCK);
  getCurrent.mockResolvedValue({ ledger_state: { epoch: 100 } });
  transactionSubmit.mockResolvedValue(TRANSACTION_SUBMIT_MOCK);
  transactionStatus.mockResolvedValue(TRANSACTION_STATUS_MOCK);
  transactionCommittedDetails.mockResolvedValue(
    TRANSACTION_COMMITTED_DETAILS_MOCK
  );
}

export function transactionCommittedDetailsMock(values: string[]) {
  return {
    transaction: {
      transaction_status: "CommittedSuccess",
      receipt: {
        output: values.map((hex) => ({
          hex,
        })),
      },
    },
  };
}
