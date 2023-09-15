const axios = require("axios");
const { UniversalSigner } = require("@redstone-finance/protocol");

const MOCK_SIGNATURE =
  "GPZOwPKiZM1UreO9Aeq5rO/fdA9VqnocYgMJ1kIKn6FC0MQmXYnnIgepT3Ji9LsHPn9wUDD8RhUN6lR5k9Mbehs=";
const MOCK_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const mockDataPackages = [
  {
    timestampMilliseconds: 1654353400000,
    signature: MOCK_SIGNATURE,
    dataPoints: [
      { dataFeedId: "mock-data-feed-id-2", value: 123 },
      { dataFeedId: "mock-data-feed-id-2", value: 123 },
    ],
  },
];
const { hrtime } = process;
const PARALLEL_MEASUREMENT = false;
const REQUESTS_COUNT = 10;
const ONE_SECOND_IN_NANOSECONDS = 1e9;
const URL = "http://localhost:3000/data-packages/bulk";
const CONFIG = {
  headers: {
    "Content-Type": "application/json",
  },
};

async function measureExecutionTime(data, requestsCount) {
  const startTime = hrtime();

  for (let requestNumber = 0; requestNumber < requestsCount; requestNumber++) {
    try {
      const response = await axios.post(URL, data, CONFIG);
      console.log(`Request ${requestNumber + 1}: ${response.status}`);
    } catch (error) {
      console.error(`Request ${requestNumber + 1} failed: ${error.message}`);
    }
  }

  const endTime = hrtime(startTime);
  const elapsedTimeInSeconds =
    endTime[0] + endTime[1] / ONE_SECOND_IN_NANOSECONDS;

  console.log(`Execution time: ${elapsedTimeInSeconds} seconds`);
  console.log(
    `Average request time: ${elapsedTimeInSeconds / requestsCount} seconds`
  );
}

async function measureExecutionTimeInParallel(data, requestsCount) {
  const requests = Array(requestsCount)
    .fill()
    .map(() => axios.post(URL, data, CONFIG));

  const startTime = hrtime();

  try {
    const responses = await Promise.all(requests);
    responses.forEach((response, requestNumber) => {
      console.log(`Request ${requestNumber + 1}: ${response.status}`);
    });
  } catch (error) {
    console.error(`One or more requests failed: ${error.message}`);
  }

  const endTime = hrtime(startTime);
  const elapsedTimeInSeconds =
    endTime[0] + endTime[1] / ONE_SECOND_IN_NANOSECONDS;

  console.log(`Execution time: ${elapsedTimeInSeconds} seconds`);
}

async function measureThroughput() {
  const requestSignature = UniversalSigner.signStringifiableData(
    mockDataPackages,
    MOCK_PRIVATE_KEY
  );
  const data = {
    requestSignature,
    dataPackages: mockDataPackages,
  };

  if (PARALLEL_MEASUREMENT) {
    return measureExecutionTimeInParallel(data, REQUESTS_COUNT);
  }
  return measureExecutionTime(data, REQUESTS_COUNT);
}
const run = async () => {
  try {
    await measureThroughput();
  } catch (error) {
    console.log(error);
  }
};

run();
