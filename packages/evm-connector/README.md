# redstone-evm-connector

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
