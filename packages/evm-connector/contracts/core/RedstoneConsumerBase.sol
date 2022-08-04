// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./RedstoneConstants.sol";
import "../libs/BitmapLib.sol";
import "../libs/SignatureLib.sol";
import "../libs/RedstoneDefaultsLib.sol";

abstract contract RedstoneConsumerBase is RedstoneConstants {
  // This param can be updated in child contracts
  uint256 public uniqueSignersThreshold = 1;

  /* ========== VIRTUAL FUNCTIONS (MAY BE OVERRIDEN IN CHILD CONTRACTS) ========== */

  function getAuthorisedSignerIndex(address _receviedSigner)
    public
    view
    virtual
    returns (uint256);

  function isTimestampValid(uint256 _receivedTimestamp)
    public
    view
    virtual
    returns (bool)
  {
    return RedstoneDefaultsLib.isTimestampValid(_receivedTimestamp);
  }

  function aggregateValues(uint256[] memory values)
    public
    view
    virtual
    returns (uint256)
  {
    return RedstoneDefaultsLib.aggregateValues(values);
  }

  /* ========== FUNCTIONS WITH IMPLEMENTATION (CAN NOT BE OVERRIDEN) ========== */

  function getOracleNumericValueFromTxMsg(bytes32 symbol)
    internal
    view
    virtual
    returns (uint256)
  {
    bytes32[] memory symbols = new bytes32[](1);
    symbols[0] = symbol;
    return getOracleNumericValuesFromTxMsg(symbols)[0];
  }

  function getOracleNumericValuesFromTxMsg(bytes32[] memory symbols)
    internal
    view
    virtual
    returns (uint256[] memory)
  {
    return _securelyExtractOracleValuesFromTxMsg(symbols);
  }

  function _securelyExtractOracleValuesFromTxMsg(bytes32[] memory symbols)
    internal
    view
    returns (uint256[] memory)
  {
    // Initializing helpful variables and allocating memory
    uint256[] memory uniqueSignerCountForSymbols = new uint256[](symbols.length);
    uint256[] memory signersBitmapForSymbols = new uint256[](symbols.length);
    uint256[][] memory valuesForSymbols = new uint256[][](symbols.length);
    for (uint256 i = 0; i < symbols.length; i++) {
      signersBitmapForSymbols[i] = 0; // empty bitmap
      valuesForSymbols[i] = new uint256[](uniqueSignersThreshold);
    }

    // Extracting the number of data packages from calldata
    uint256 calldataNegativeOffset = _extractByteSizeOfUnsignedMetadata();
    uint256 dataPackagesCount = _extractDataPackagesCountFromCalldata(
      calldataNegativeOffset
    );
    calldataNegativeOffset += DATA_PACKAGES_COUNT_BS;

    // Data packages extraction in a loop
    for (
      uint256 dataPackageIndex = 0;
      dataPackageIndex < dataPackagesCount;
      dataPackageIndex++
    ) {
      // Extract data package details and update calldata offset
      uint256 dataPackageByteSize = _extractDataPackage(
        symbols,
        uniqueSignerCountForSymbols,
        signersBitmapForSymbols,
        valuesForSymbols,
        calldataNegativeOffset
      );
      calldataNegativeOffset += dataPackageByteSize;
    }

    // Validating numbers of unique signers and calculating aggregated values for each symbol
    return
      _getAggregatedValues(symbols.length, valuesForSymbols, uniqueSignerCountForSymbols);
  }

  function _extractDataPackage(
    bytes32[] memory symbols,
    uint256[] memory uniqueSignerCountForSymbols,
    uint256[] memory signersBitmapForSymbols,
    uint256[][] memory valuesForSymbols,
    uint256 calldataOffset
  ) private view returns (uint256) {
    uint16 dataPointsCount;
    uint256 signerIndex;
    uint256 defaultDataPointValueByteSize = _getDataPointValueByteSize(calldataOffset);

    // We use scopes to resolve problem with too deep stack
    {
      uint48 extractedTimestamp;
      address signerAddress;
      bytes32 signedHash;
      bytes memory signedMessage;
      uint256 signedMessageBytesCount;

      assembly {
        // Extracting the number of data points
        let negativeOffset := add(calldataOffset, add(SIG_BS, STANDARD_SLOT_BS))
        dataPointsCount := calldataload(sub(calldatasize(), negativeOffset))
      }

      signedMessageBytesCount =
        uint256(dataPointsCount) *
        (defaultDataPointValueByteSize + DATA_POINT_SYMBOL_BS) +
        DATA_PACKAGE_WITHOUT_DATA_POINTS_AND_SIG_BS;

      assembly {
        // Extracting the signed message
        signedMessage := extractBytesFromCalldata(
          add(calldataOffset, SIG_BS),
          signedMessageBytesCount
        )

        // Hashing the signed message
        signedHash := keccak256(
          add(signedMessage, BYTES_ARR_LEN_VAR_BS),
          signedMessageBytesCount
        )

        // Extracting timestamp
        extractedTimestamp := extractValueFromCalldata(
          add(calldataOffset, TIMESTAMP_NEGATIVE_OFFSET_IN_DATA_PACKAGE)
        )

        ///////////////////////////////// FUNCTIONS /////////////////////////////////

        function initByteArray(bytesCount) -> ptr {
          ptr := mload(FREE_MEMORY_PTR)
          // TODO: check why this condition is added in official yul documentation
          // if iszero(ptr) {
          //   ptr := 0x60
          // }
          mstore(ptr, bytesCount)
          ptr := add(ptr, BYTES_ARR_LEN_VAR_BS)
          mstore(FREE_MEMORY_PTR, add(ptr, add(BYTES_ARR_LEN_VAR_BS, bytesCount)))
        }

        function extractBytesFromCalldata(offset, bytesCount) -> extractedBytes {
          let extractedBytesStartPtr := initByteArray(bytesCount)
          calldatacopy(
            extractedBytesStartPtr,
            sub(calldatasize(), add(offset, bytesCount)),
            bytesCount
          )
          extractedBytes := sub(extractedBytesStartPtr, BYTES_ARR_LEN_VAR_BS)
        }

        function extractValueFromCalldata(offset) -> valueFromCalldata {
          valueFromCalldata := calldataload(
            sub(calldatasize(), add(offset, STANDARD_SLOT_BS))
          )
        }
      }

      // Validating timestamp
      require(isTimestampValid(extractedTimestamp), "Timestamp is not valid");

      // Verifying the off-chain signature against on-chain hashed data
      signerAddress = SignatureLib.recoverSignerAddress(
        signedHash,
        calldataOffset + SIG_BS
      );
      signerIndex = getAuthorisedSignerIndex(signerAddress);
    }

    // Updating helpful arrays
    {
      bytes32 dataPointSymbol;
      uint256 dataPointValue;
      for (
        uint256 dataPointIndex = 0;
        dataPointIndex < dataPointsCount;
        dataPointIndex++
      ) {
        // Extracting symbol and value for current data point
        (dataPointSymbol, dataPointValue) = _extractDataPointValueAndSymbol(
          calldataOffset,
          defaultDataPointValueByteSize,
          dataPointIndex
        );

        for (uint256 symbolIndex = 0; symbolIndex < symbols.length; symbolIndex++) {
          if (dataPointSymbol == symbols[symbolIndex]) {
            uint256 bitmapSignersForSymbol = signersBitmapForSymbols[symbolIndex];

            // bool currentSignerWasNotCountedForCurrentSymbol = !BitmapLib.getBitFromBitmap(
            //   bitmapSignersForSymbol,
            //   signerIndex
            // );

            if (
              !BitmapLib.getBitFromBitmap(bitmapSignersForSymbol, signerIndex) && /* currentSignerWasNotCountedForCurrentSymbol */
              uniqueSignerCountForSymbols[symbolIndex] < uniqueSignersThreshold
            ) {
              // Increase unique signer counter
              uniqueSignerCountForSymbols[symbolIndex]++;

              // Add new value
              valuesForSymbols[symbolIndex][
                uniqueSignerCountForSymbols[symbolIndex] - 1
              ] = dataPointValue;

              // Update signers bitmap
              signersBitmapForSymbols[symbolIndex] = BitmapLib.setBitInBitmap(
                bitmapSignersForSymbol,
                signerIndex
              );
            }
          }
        }
      }
    }

    // Return total data package byte size
    return
      DATA_PACKAGE_WITHOUT_DATA_POINTS_BS +
      (defaultDataPointValueByteSize + DATA_POINT_SYMBOL_BS) *
      dataPointsCount;
  }

  function _getDataPointValueByteSize(uint256 calldataOffset)
    internal
    pure
    virtual
    returns (uint256)
  {
    calldataOffset;
    return DEFAULT_DATA_POINT_VALUE_BS;
  }

  function _extractDataPointValueAndSymbol(
    uint256 calldataOffset,
    uint256 defaultDataPointValueByteSize,
    uint256 dataPointIndex
  ) internal pure virtual returns (bytes32 dataPointSymbol, uint256 dataPointValue) {
    assembly {
      let negativeOffsetToDataPoints := add(
        calldataOffset,
        DATA_PACKAGE_WITHOUT_DATA_POINTS_BS
      )
      let dataPointCalldataOffset := sub(
        calldatasize(),
        add(
          negativeOffsetToDataPoints,
          mul(
            add(1, dataPointIndex),
            add(defaultDataPointValueByteSize, DATA_POINT_SYMBOL_BS)
          )
        )
      )
      dataPointSymbol := calldataload(dataPointCalldataOffset)
      dataPointValue := calldataload(add(dataPointCalldataOffset, DATA_POINT_SYMBOL_BS))
    }
  }

  function _extractByteSizeOfUnsignedMetadata() private pure returns (uint256) {
    // Using uint24, because unsigned metadata byte size number has 3 bytes
    uint24 unsignedMetadataByteSize;
    assembly {
      let calldataOffset := sub(calldatasize(), REDSTONE_MARKER_BS)
      unsignedMetadataByteSize := calldataload(sub(calldataOffset, STANDARD_SLOT_BS))
    }
    return unsignedMetadataByteSize + UNSGINED_METADATA_BYTE_SIZE_BS + REDSTONE_MARKER_BS;
  }

  function _extractDataPackagesCountFromCalldata(uint256 calldataNegativeOffset)
    private
    pure
    returns (uint256)
  {
    // Using uint16, because unsigned metadata byte size number has 2 bytes
    uint16 dataPackagesCount;
    assembly {
      let calldataOffset := sub(calldatasize(), calldataNegativeOffset)
      dataPackagesCount := calldataload(sub(calldataOffset, STANDARD_SLOT_BS))
    }
    return dataPackagesCount;
  }

  function _getAggregatedValues(
    uint256 symbolsLength,
    uint256[][] memory valuesForSymbols,
    uint256[] memory uniqueSignerCountForSymbols
  ) internal view returns (uint256[] memory) {
    uint256[] memory aggregatedValues = new uint256[](symbolsLength);

    for (uint256 symbolIndex = 0; symbolIndex < symbolsLength; symbolIndex++) {
      require(
        uniqueSignerCountForSymbols[symbolIndex] >= uniqueSignersThreshold,
        "Insufficient number of unique signers"
      );
      uint256 aggregatedValueForSymbol = aggregateValues(valuesForSymbols[symbolIndex]);
      aggregatedValues[symbolIndex] = aggregatedValueForSymbol;
    }

    return aggregatedValues;
  }
}
