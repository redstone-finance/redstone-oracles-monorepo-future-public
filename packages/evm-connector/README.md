# redstone-evm-connector

## Notes for reviewers

- V2: standard version with off-chain aggregation (symbol has 32 bytes, each value has 32 bytes)
- V3: "More "dynamic" version with off-chain aggregation (symbol has 32 bytes, each value can have up to 32 bytes)
- V4: "Very dynamic" version (symbol has 32 bytes, each value can have any number of bytes, but all values in the same data package should have the same number of bytes)

_- V5: "The most dynamic" version (symbol has 32 bytes, each value can have any number of bytes (up to 16mb)). Each value in data package may have its own size_

**I decided not to implement V5 for now, since benefits from its implementation are not high, but it would add a lot of additional code, which we would need to maintain. The only benefit I see in V5 is that for dynamic values with different sizes in the same data package it can save some amount of gas.**

## EVM Asembly (yul) resources

- https://dlt-repo.net/storage-vs-memory-vs-stack-in-solidity-ethereum
- https://docs.soliditylang.org/en/latest/assembly.html
- https://docs.soliditylang.org/en/latest/yul.html
- https://docs.soliditylang.org/en/latest/abi-spec.html

## Potential problems

### Stack too deep

The reason is a limitation in how variables can be referenced in the EVM stack. While you can have more than 16 variables in it, once you try to reference a variable in slot 16 or higher, it will fail.

- https://forum.openzeppelin.com/t/stack-too-deep-when-compiling-inline-assembly/11391/7
- https://soliditydeveloper.com/stacktoodeep

**Different solutions**

1. Use an internal function (most preferred method)
2. Make use of block scoping
3. Utilise structs

## Questions

- What happens with the stack and memory when another function is being called?

## Plan for the on-chain aggregation support

### Pseudo code

```js
// Bytes structure: <DataPackage[]:?b><DataPackagesCount:2b>
// DataPackage: <SymbolValueData[]:(n * 64)b><Timestamp:32b><Size(n):2b><Signature:65b> - same as in current version
// SymbolValueData: <Symbol:32b><Value:32b> - same as in current version

function getOracleValueFromTxMsg(symbol: string) {
  return getOracleValuesFromTxMsg([symbol])[0];
}

function getOracleValuesFromTxMsg(symbols: string[SYM_COUNT]): uin256[] {
  assertUniqueSymbols(symbols);

  // Initial variables
  const initialBytesAppendix = extractInitialBytesAppendix();
  let bytesOffset = 0;

  // Extract dataPackagesCount
  const dataPackagesCount: uint16 = extractLast2Bytes(initialBytesAppendix);
  bytesOffset += 2;

  // Extract details for each data package
  for (
    let dataPackageIndex = 0;
    dataPackageIndex < dataPackagesCount;
    dataPackagesCount++
  ) {
    const { signature, dataPackageBytesSize, dataPoints, timestamp } =
      parseDataPackage(initialBytesAppendix, offset);
    offset += dataPackageBytesSize;
    assertValidTimestamp(timestamp);
    const signer = verifySignatureAndReturnSigner(signature);
    assertAuthorisedSigner(signer);

    // ? may be replaces with the exact number if we know the number of required signers upfront
    const countedSignersForSymbols: address[?][SYM_COUNT] = initArray();
    const resultValuesBeforeAggregation: uint256[?][SYM_COUNT] = initResultArrayOfArrays();

    for (const (symbol, symbolIndex) of symbols) {
      for (const dataPoint of dataPoints) {
        if (dataPoint.symbol === symbol) {
          const currentSignerWasNotCountedForCurrentSymbol = true; // TODO: it can be done in a loop

          if (currentSignerWasNotCountedForCurrentSymbol) {
            resultValuesBeforeAggregation[symbolIndex].push(dataPoint.value);
            countedSignersForSymbols[symbolIndex].push(signer);
          }
        }
      }
    }


    // On-chain aggregation
    const resultValues: uint256[];
    for (const resultValuesArray of resultValuesBeforeAggregation) {
      assertEnoughValuesFromUniqueProviders(resultValuesArray);
      resultValues.push(calculateMedian(resultValuesArray));
    }

    return resultValues;
  }
}

// TODO: implement
function calculateMedian(values: uint256) {
  // TODO: sort etc.
  return value[1];
}
```

## Notes from conversation with Kuba

```
== Redstone evm connector updates ==

- Questions
    1. Why does size have only one byte? Maybe this was the reason of problems with redstone-main data feed

- Changes
    - Attached to calldata data format
        - All bytes struct: <DataPackage[]:?b><DataPackagesCount:2b>
        - DataPackage: <SymbolValueData[]:(n * 64)b><Timestamp:32b><Size(n):1b><Signature:65b> - same as in current version
        - SymbolValueData: <Symbol:32b><Value:32b> - same as in current version

    - In contracts
        - getOracleValueFromTxMsg and getOracleValuesFromTxMsg should support more arguments
            - minSignersCount: uint16 // this requirement will apply to each requested symbol
            - maxPercentageDiff: uint8
            - new functions will iterate over each data package and count unique signers for each requested symbol. Not each data package should contain all requested symbols - it allows to pass several packages for single symbols and validate subsets of symbols for big data feeds (e.g. ETH and STX from main redstone feed)
        - we will add a new overridable function to handle aggregation logic (by default - median):
            - aggregateDataFromDifferentProviders(dataPoints: uint256[], maxPercentageDiff: uint8): uint256
            - this function will be used inside getOracleValuesFromTxMsg and getOracleValueFromTxMsg to calculate result values

    - In js interface
        - We will update configuration to support fetching multiple packages with flexible data sources config format for each package
            - DataFeedConfig: { dataPackagesRequests: DataPackageRequest[] }
            - DataPackageRequest: { asset?: string, dataSources: DataSourcesConfig }
            - DataSourcesConfig: { sources: ..., valueSelectionAlgorithm: ..., ... } - existing data sources config
```
