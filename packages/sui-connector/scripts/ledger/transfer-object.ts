import { generateTransactionData } from "./generate-transaction-data";

const OBJECT_ID_TO_TRANSFER =
  "0x1afe086edb3e945c2b2767aa8430b5c2e190b9108fb2820d8a2ad2acfcb1ff1c";
const DESTINATION_ADDRESS =
  "0x1be84a182296d18fd3bc8fcffc24b54db4af09c49d4e734395a8b8e16971e19f";

void generateTransactionData((tx) =>
  tx.transferObjects([OBJECT_ID_TO_TRANSFER], DESTINATION_ADDRESS)
);
