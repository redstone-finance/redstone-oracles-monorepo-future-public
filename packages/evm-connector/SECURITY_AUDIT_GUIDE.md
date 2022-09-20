# Security audit guide

The following document contains helpful details for the security audit of the redstone-evm-connector smart contracts.

## Short intro
RedStone EVM connector implements an alternative design of providing oracle data to smart contracts. Instead of constantly persisting data on EVM storage (by data providers), the information is brought on-chain only when needed (by end users). Until that moment data remains in the decentralised cache layer, which is powered by RedStone light cache gateways and streamr data broadcasting protocol. Data is transferred to the EVM by end users, who should attach the signed data packages to their transaction calldata. The information integrity is verified on-chain through signature checking.

## How to get into context

Here are the recommended steps to get into the context of redstone oracles architecture and redstone-evm-connector specifically:

1. Carefully read the [evm-connector readme](./README.md)
2. Go through the [redstone-protocol](../protocol/) tests. Esp. [data-package.test.ts](../protocol/test/data-package.test.ts) and [redstone-payload.test.ts](../protocol/test/redstone-payload.test.ts) to understand signed data packages serialization into bytes. It will be extremely helpful for understanding the evm-connector smart contracts
3. Read the [BaseWrapper.ts in evm-connector](./src/wrappers/BaseWrapper.ts) to understand how we attach the signed data packages to the transasctions calldata (the main line of code is: `tx.data = tx.data + dataToAppend;`)
4. Read sample contracts and tests for [redstone-evm-connector](./test/) to understand how the contracts will be used by redstone-based dapps. Recommended reading order is below:
    1. Use case with numeric data (single asset at once)
        - [contracts/samples/SampleRedstoneConsumerNumericMock.sol](contracts/samples/SampleRedstoneConsumerNumericMock.sol)
        - [test/mock-wrapper/numbers.test.ts](test/mock-wrapper/numbers.test.ts)
    2. Use case with numeric data (several assets at once)
        - [contracts/samples/SampleRedstoneConsumerNumericMockManyDataFeeds.sol](contracts/samples/SampleRedstoneConsumerNumericMockManyDataFeeds.sol)
        - [test/mock-wrapper/numbers-many-data-feeds.test.ts](test/mock-wrapper/numbers-many-data-feeds.test.ts)
    3. Use case with bytes data (single asset at once)
        - [contracts/samples/SampleRedstoneConsumerBytesMock.sol](contracts/samples/SampleRedstoneConsumerBytesMock.sol)
        - [test/mock-wrapper/bytes.test.ts](test/mock-wrapper/bytes.test.ts)
    4. Use case with bytes data (several asset at once)
        - [contracts/samples/SampleRedstoneConsumerBytesMockManyDataFeeds.sol](contracts/samples/SampleRedstoneConsumerBytesMockManyDataFeeds.sol)
        - [test/mock-wrapper/bytes-many-data-feeds.test.ts](test/mock-wrapper/bytes-many-data-feeds.test.ts)
    5. Use case with calldata proxying
        - [contracts/samples/SampleProxyConnector.sol](contracts/samples/SampleProxyConnector.sol)
        - [test/mock-wrapper/proxy-connector.test.ts](test/mock-wrapper/proxy-connector.test.ts)
    6. Rest of tests (you can safely skip SampleSyntheticToken.sol and synthetic-token.test.ts, as it was added just to test a bigger use case)
5. Read and audit smart contracts in the [evm-connector/contracts/core](./contracts/core/). There are some bytes-based magic tricks (esp. in RedstoneConsumerBytesBase.sol), but we've tried to add as many comments as possible to make it more readable :)

## Potential risks / Audit goals

Since we are building the oracle system, we want to be sure that it's impossible to:
- Provide incorrectly signed data to the consumer contracts
- Provide data signed by unauthorised signers
- Provide data signed by insufficient number of unique authorised signers
- Provide data, the timestamp of which should not be accepted by consumer contracts (e.g. too old data)
- Break the consumer contracts in any way

## Known issues

### 1. Signature reusing
We use a standard ECDSA signatures for data packages, so it may be possible for attackers to find another signed message (e.g. a signed ethereum transaction) created by a trusted data provider and try to reuse it. 

However, this is quite unlikely that this kind of a publicly available message will be a valid signed data package with correct bytes length and timestamp. We also ask our data providers not to push blockchain transactions signed by the private keys that they use for data packages signing.

### 2. Blocking data service by one corrupted participant
If at least one signed data package attached to a transaction will be corrupted, then the transaction will fail. That's why we will implement an off-chain validation mechanism and will not attach incorrectly signed data packages to the transactions.

### 3. Arbitrage opportunities
Assume that data providers update data every 10 seconds, but smart contracts accept data not older than 3 minutes (180 seconds) from current `block.timestamp`. Then for some use cases (e.g. synthetic exchange) it creates obvious arbitrage opportunities for attackers, as they can select any of ~18 available signed data packages with different values and try to use them to gain profits. To solve this problem, protocols that rely on redstone oracles can create a kind of data caching based on the smart contract storage with the following logic described in the pseudo-code below:

```js
uint256 constant CACHE_TTL_SECONDS = 60;

uint256 lastCachedEthPrice;
uint256 lastEthPriceUpdateTimestamp;

function getEthPriceUsingCache() private view returns(uint256) {
    if (lastEthPriceUpdateTimestamp + CACHE_TTL_SECONDS < block.timestamp) {
        // Cache expired, updating the cache...
        lastCachedEthPrice = getOracleNumericValueFromTxMsg(bytes32("ETH"));
        lastEthPriceUpdateTimestamp = block.timestamp;
    }
    return lastCachedEthPrice;
}

function doSomeAction() {
    uint256 ethPrice = getEthPriceUsingCache();
    // ... any logic based on the price
    // Thanks to the caching it's not possible to pass different
    // signed data packages in order to gain profits from arbitrage actions
}
```
