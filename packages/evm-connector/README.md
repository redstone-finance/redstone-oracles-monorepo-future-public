# redstone-evm-connector

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

function getOracleValueFromTxMsg(dataFeedId: string) {
  return getOracleValuesFromTxMsg([dataFeedId])[0];
}

function getOracleValuesFromTxMsg(dataFeedIds: string[SYM_COUNT]): uin256[] {
  assertUniqueSymbols(dataFeedIds);

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

    for (const (dataFeedId, dataFeedIdIndex) of dataFeedIds) {
      for (const dataPoint of dataPoints) {
        if (dataPoint.dataFeedId === dataFeedId) {
          const currentSignerWasNotCountedForCurrentSymbol = true; // TODO: it can be done in a loop

          if (currentSignerWasNotCountedForCurrentSymbol) {
            resultValuesBeforeAggregation[dataFeedIdIndex].push(dataPoint.value);
            countedSignersForSymbols[dataFeedIdIndex].push(signer);
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
            - minSignersCount: uint16 // this requirement will apply to each requested dataFeedId
            - maxPercentageDiff: uint8
            - new functions will iterate over each data package and count unique signers for each requested dataFeedId. Not each data package should contain all requested dataFeedIds - it allows to pass several packages for single dataFeedIds and validate subsets of dataFeedIds for big data feeds (e.g. ETH and STX from main redstone feed)
        - we will add a new overridable function to handle aggregation logic (by default - median):
            - aggregateDataFromDifferentProviders(dataPoints: uint256[], maxPercentageDiff: uint8): uint256
            - this function will be used inside getOracleValuesFromTxMsg and getOracleValueFromTxMsg to calculate result values

    - In js interface
        - We will update configuration to support fetching multiple packages with flexible data sources config format for each package
            - DataFeedConfig: { dataPackagesRequests: DataPackageRequest[] }
            - DataPackageRequest: { asset?: string, dataSources: DataSourcesConfig }
            - DataSourcesConfig: { sources: ..., valueSelectionAlgorithm: ..., ... } - existing data sources config
```
