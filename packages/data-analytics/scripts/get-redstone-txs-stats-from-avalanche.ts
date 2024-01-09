import cliProgress from "cli-progress";
import { Transaction } from "ethers";
import prompts from "prompts";
import Web3 from "web3";

const REDSTONE_MARKER_HEX = "000002ed57011e0000";
const AVAX_URL = "https://api.avax.network/ext/bc/C/rpc";
const BATCH_SIZE = 100;

const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);
const web3 = new Web3(AVAX_URL);

const getPromptQuestions = (latestBlockNumber: number): any[] => {
  return [
    {
      type: "number",
      name: "blockCount",
      message: `How many blocks you want to query? (Current Block Number is: ${latestBlockNumber}`,
    },
  ];
};

async function getTransactionsByCallData(
  latestBlock: number,
  blockCount: number,
  callData: string,
  blockPerPage = 50
) {
  const matchingTransactions: string[] = [];

  const startingBlock = latestBlock - blockCount;

  let loopIterator = startingBlock > 0 ? startingBlock : 0;
  let progressCounter = 0;

  progressBar.start(latestBlock - loopIterator, 0);

  while (loopIterator < latestBlock) {
    const promises = [...Array(BATCH_SIZE).keys()].map((block) =>
      web3.eth.getBlock(block, true)
    );

    let blockResults: any[] = [];
    await Promise.all(promises).then((results) => {
      results.forEach((result) => blockResults.push(result));
    });

    for (
      let blockIterator = 0;
      blockIterator < blockResults.length;
      blockIterator++
    ) {
      for (
        let transactionIterator = 0;
        transactionIterator < blockResults[blockIterator].transactions.length;
        transactionIterator++
      ) {
        const tx =
          blockResults[blockIterator].transactions[transactionIterator];
        if (tx.input.endsWith(callData)) {
          matchingTransactions.push(tx);
        }
      }
    }
    progressCounter += blockPerPage;
    progressBar.update(progressCounter);
    loopIterator += blockPerPage;
  }

  progressBar.stop();
  return matchingTransactions;
}

const countUniqueAddresses = (transactions: Transaction[]) => {
  const addresses = new Set<string>();
  transactions.forEach((tx) => {
    addresses.add(tx.from!);
    addresses.add(tx.to!);
  });
  return addresses.size;
};

const getTotalGasPriceFromTransactions = (transactions: any[]) => {
  let totalGasPrice = web3.utils.toBN(0);
  transactions.forEach((tx) => {
    totalGasPrice = totalGasPrice.add(web3.utils.toBN(tx.gasPrice));
  });
  return totalGasPrice.toString();
};

const getCallDataSizeFromTransactions = (transactions: Transaction[]) => {
  let totalCallDataSizeInBits = 0;

  transactions.forEach((tx: any) => {
    totalCallDataSizeInBits += (tx.input.length - 2) / 4;
  });
  return totalCallDataSizeInBits;
};

const getNumberOfFailedTx = (transactions: any[]) => {
  let invalidTransactions = 0;
  transactions.forEach((transaction) => {
    if (transaction.status === "0x0") {
      invalidTransactions++;
    }
  });
  return invalidTransactions;
};

const printStatistics = (
  totalTransactions: number,
  invalidTransactions: number,
  uniqueAddresses: number,
  totalGasPrice: string,
  totalCallDataSize: number
) => {
  console.log(`Total transactions: ${totalTransactions}`);
  console.log(`Invalid transactions: ${invalidTransactions}`);
  console.log(`Unique addresses in transactions: ${uniqueAddresses}`);
  console.log(`Total Gas Price Handled: ${totalGasPrice}`);
  console.log(
    `Total Call data handled: ${Math.floor(totalCallDataSize / 8)}Kb`
  );
};

const getStatisticsFromTransactions = (transactions: any[]) => {
  const totalTransactions = transactions.length;
  const invalidTransactions = getNumberOfFailedTx(transactions);
  const uniqueAddresses = countUniqueAddresses(transactions);
  const totalGasPrice = getTotalGasPriceFromTransactions(transactions);
  const totalCallDataSize = getCallDataSizeFromTransactions(transactions);
  printStatistics(
    totalTransactions,
    invalidTransactions,
    uniqueAddresses,
    totalGasPrice,
    totalCallDataSize
  );

  return;
};

async function query() {
  const latestBlock = await web3.eth.getBlockNumber();
  const { blockCount } = await prompts(getPromptQuestions(latestBlock));
  const transactions = await getTransactionsByCallData(
    latestBlock,
    blockCount,
    REDSTONE_MARKER_HEX,
    50
  );
  getStatisticsFromTransactions(transactions);
}

const run = async () => {
  try {
    await query();
  } catch (error) {
    console.log(error);
  }
};

run();
