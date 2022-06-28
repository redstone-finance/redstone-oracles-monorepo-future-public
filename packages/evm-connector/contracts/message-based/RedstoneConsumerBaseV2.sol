// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol";

import "../commons/NumericArrayLib.sol";

// Implementation with on-chain aggregation

abstract contract RedstoneConsumerBaseV2 {
  // This param can be updated in child contracts
  uint256 public uniqueSignersTreshold = 1;

  uint256 constant _MAX_DATA_TIMESTAMP_DELAY = 3 * 60; // 3 minutes
  uint256 constant _MAX_BLOCK_TIMESTAMP_DELAY = 60; // 60 seconds

  // Constants for better readablity of the assembly code
  // BS - Bytes size
  // PTR - Pointer (memory location)
  // SIG - Signature

  // Solidity and YUL constants
  uint256 constant STANDARD_SLOT_BS = 32;
  uint256 constant FREE_MEMORY_PTR = 0x40;
  uint256 constant BYTES_ARR_LEN_VAR_BS = 32;
  uint256 constant ECDSA_SIG_R_BS = 32;
  uint256 constant ECDSA_SIG_S_BS = 32;
  uint256 constant FUNCTION_SIGNATURE_BS = 4;

  // RedStone protocol consts
  uint256 constant SIG_BS = 65;
  uint256 constant TIMESTAMP_BS = 6;
  uint256 constant DATA_PACKAGES_COUNT_BS = 2;
  uint256 constant DATA_POINTS_COUNT_BS = 3;
  uint256 constant DEFAULT_DATA_POINT_VALUE_BYTE_SIZE_BS = 4;
  uint256 constant DATA_POINT_SYMBOL_BS = 32;
  uint256 constant DEFAULT_DATA_POINT_VALUE_BS = 32;

  // "Dynamic" values (based on consts)
  uint256 constant TIMESTAMP_NEGATIVE_OFFSET_IN_DATA_PACKAGE = 72; // SIG_BS + DATA_POINTS_COUNT_BS + DEFAULT_DATA_POINT_VALUE_BYTE_SIZE_BS
  uint256 constant DATA_PACKAGE_WITHOUT_DATA_POINTS_BS = 78; // DEFAULT_DATA_POINT_VALUE_BYTE_SIZE_BS + TIMESTAMP_BS + DATA_POINTS_COUNT_BS + SIG_BS
  uint256 constant DATA_PACKAGE_WITHOUT_DATA_POINTS_AND_SIG_BS = 13; // DEFAULT_DATA_POINT_VALUE_BYTE_SIZE_BS + TIMESTAMP_BS + DATA_POINTS_COUNT_BS

  /* ========== VIRTUAL FUNCTIONS (MAY BE OVERRIDEN IN CHILD CONTRACTS) ========== */

  function getMaxDataTimestampDelay() public view virtual returns (uint256) {
    return _MAX_DATA_TIMESTAMP_DELAY;
  }

  function getMaxBlockTimestampDelay() public view virtual returns (uint256) {
    return _MAX_BLOCK_TIMESTAMP_DELAY;
  }

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
    // Getting data timestamp from future seems quite unlikely
    // But we've already spent too much time with different cases
    // Where block.timestamp was less than dataPackage.timestamp.
    // Some blockchains may case this problem as well.
    // That's why we add MAX_BLOCK_TIMESTAMP_DELAY
    // and allow data "from future" but with a small delay
    require(
      (block.timestamp + getMaxBlockTimestampDelay()) > _receivedTimestamp,
      "Data with future timestamps is not allowed"
    );

    return
      block.timestamp < _receivedTimestamp ||
      block.timestamp - _receivedTimestamp < getMaxDataTimestampDelay();
  }

  // By default we use median aggregation
  // But you can override this function with any other aggregation logic
  function aggregateValues(uint256[] memory values)
    public
    view
    virtual
    returns (uint256)
  {
    return NumericArrayLib.pickMedian(values);
  }

  /* ========== FUNCTIONS WITH IMPLEMENTATION (CAN NOT BE OVERRIDEN) ========== */

  function getOracleValueFromTxMsg(bytes32 symbol) internal view returns (uint256) {
    bytes32[] memory symbols = new bytes32[](1);
    symbols[0] = symbol;
    return getOracleValuesFromTxMsg(symbols)[0];
  }

  function getOracleValuesFromTxMsg(bytes32[] memory symbols)
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
      valuesForSymbols[i] = new uint256[](uniqueSignersTreshold);
    }

    // Extracting the number of data packages from calldata
    uint256 dataPackagesCount = _extractDataPackagesCountFromCalldata();
    uint256 calldataOffset = DATA_PACKAGES_COUNT_BS;

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
        calldataOffset
      );
      calldataOffset += dataPackageByteSize;
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
    uint256 defaultDataPointValueByteSize = _getDefaultDataPointValueByteSize(
      calldataOffset
    );

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
      signerAddress = _recoverSignerAddress(signedHash, calldataOffset + SIG_BS);
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

            // bool currentSignerWasNotCountedForCurrentSymbol = !_getBitFromBitmap(
            //   bitmapSignersForSymbol,
            //   signerIndex
            // );

            if (
              !_getBitFromBitmap(bitmapSignersForSymbol, signerIndex) && /* currentSignerWasNotCountedForCurrentSymbol */
              uniqueSignerCountForSymbols[symbolIndex] < uniqueSignersTreshold
            ) {
              // Increase unique signer counter
              uniqueSignerCountForSymbols[symbolIndex]++;

              // Add new value
              valuesForSymbols[symbolIndex][
                uniqueSignerCountForSymbols[symbolIndex] - 1
              ] = dataPointValue;

              // Update signers bitmap
              signersBitmapForSymbols[symbolIndex] = _setBitInBitmap(
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

  function _getDefaultDataPointValueByteSize(uint256 calldataOffset)
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

  function _setBitInBitmap(uint256 bitmap, uint256 bitIndex)
    private
    pure
    returns (uint256)
  {
    return bitmap | (1 << bitIndex);
  }

  function _getBitFromBitmap(uint256 bitmap, uint256 bitIndex)
    private
    pure
    returns (bool)
  {
    uint256 bitAtIndex = bitmap & (1 << bitIndex);
    return bitAtIndex > 0;
  }

  function _extractDataPackagesCountFromCalldata() private pure returns (uint256) {
    uint16 dataPackagesCount;
    assembly {
      dataPackagesCount := calldataload(sub(calldatasize(), STANDARD_SLOT_BS))
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
        uniqueSignerCountForSymbols[symbolIndex] >= uniqueSignersTreshold,
        "Insufficient number of unique signers"
      );
      uint256 aggregatedValueForSymbol = aggregateValues(valuesForSymbols[symbolIndex]);
      aggregatedValues[symbolIndex] = aggregatedValueForSymbol;
    }

    return aggregatedValues;
  }

  function _recoverSignerAddress(bytes32 signedHash, uint256 signatureCalldataOffset)
    private
    pure
    returns (address)
  {
    bytes32 r;
    bytes32 s;
    uint8 v;
    assembly {
      let signatureCalldataStartPos := sub(calldatasize(), signatureCalldataOffset)
      r := calldataload(signatureCalldataStartPos)
      signatureCalldataStartPos := add(signatureCalldataStartPos, ECDSA_SIG_R_BS)
      s := calldataload(signatureCalldataStartPos)
      signatureCalldataStartPos := add(signatureCalldataStartPos, ECDSA_SIG_S_BS)
      v := byte(0, calldataload(signatureCalldataStartPos)) // last byte of the signature memoty array
    }
    return ecrecover(signedHash, v, r, s);
  }
}
