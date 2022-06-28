// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol";

import "../commons/NumericArrayLib.sol";

// Implementation with on-chain aggregation

abstract contract RedstoneConsumerBaseV3 {
  // This param can be updated in child contracts
  uint256 public uniqueSignersTreshold = 1;

  uint256 constant _MAX_DATA_TIMESTAMP_DELAY = 3 * 60; // 3 minutes
  uint256 constant _MAX_BLOCK_TIMESTAMP_DELAY = 60; // 60 seconds

  // Constants for better readablity of the assembly code
  // BS - Bytes size
  // PTR - Pointer (memory location)
  // SIG - Signature
  // DP - Data point
  // DP_NUMBER - Number of data points
  uint256 constant STANDARD_SLOT_BS = 32;
  uint256 constant FREE_MEMORY_PTR = 0x40;
  uint256 constant SIG_BS = 65;
  uint256 constant DATA_PACKAGES_NUMBER_BS = 2;
  uint256 constant DP_NUMBER_BS = 3;
  uint256 constant DP_NUMBER_AND_SIG_BS = 67; // STANDARD_SLOT_BS + DP_NUMBER_BS
  uint256 constant TIMESTAMP_BS = 6;
  uint256 constant DEFAULT_DATA_POINT_VALUE_BYTE_SIZE_BS = 4;
  uint256 constant TIMESTAMP_CALLDATA_OFFSET = 72;
  uint256 constant DATAPOINTS_CALLDATA_OFFSET = 78; // DEFAULT_DATA_POINT_VALUE_BYTE_SIZE_BS + TIMESTAMP_BS + DP_NUMBER_BS + SIG_BS
  uint256 constant DP_WITHOUT_DATA_POINTS_BS = 78;
  uint256 constant DP_WITHOUT_DATA_POINTS_AND_SIG_BS = 13;
  uint256 constant DP_SYMBOL_BS = 32;
  uint256 constant BYTES_ARR_LEN_VAR_BS = 32;
  uint256 constant MAX_INT =
    0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
  // uint256 constant DP_SYMBOL_AND_VALUE_BS = 64;
  uint256 constant ECDSA_SIG_R_BS = 32;
  uint256 constant ECDSA_SIG_S_BS = 32;
  uint256 constant ECDSA_SIG_S_OFFSET = 64; // BYTES_ARR_LEN_VAR_BS + ECDSA_SIG_R_BS
  uint256 constant ECDSA_SIG_V_OFFSET = 96; // BYTES_ARR_LEN_VAR_BS + ECDSA_SIG_R_BS + ECDSA_SIG_S_BS
  uint256 constant FUNCTION_SIGNATURE_BS = 4;
  bytes4 constant GET_AUTHORISED_SIGNER_INDEX_FUN_SIG = hex"3ce142f5";
  bytes4 constant IS_TIMESTAMP_VALID_FUN_SIG = hex"75058205";

  // bytes32 constant IS_TIMESTAMP_VALID_FUNC_SIG = bytes32(0x1234);
  // bytes32 constant IS_SIGNER_AUTHORISED_FUNC_SIG = bytes32(0x1234);

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
    uint256 calldataOffset = DATA_PACKAGES_NUMBER_BS;

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
    uint256 defaultDataPointValueByteSize;
    // uint256 dpSymbolAndValueByteSize = defaultDataPointValueByteSize + DP_SYMBOL_BS;

    // We use scopes to resolve problem with too deep stack
    {
      uint48 extractedTimestamp;
      address signerAddress;
      bytes32 signedHash;
      bytes memory signedMessage;
      uint256 signedMessageBytesCount;

      uint24 defaultDataPointValueByteSizeTmp;
      assembly {
        // Extracting the number of data points
        let negativeOffset := add(calldataOffset, add(SIG_BS, STANDARD_SLOT_BS))
        dataPointsCount := calldataload(sub(calldatasize(), negativeOffset))

        // Extracting the default data point value byte size
        defaultDataPointValueByteSizeTmp := calldataload(
          sub(sub(calldatasize(), negativeOffset), DP_NUMBER_BS)
        )
      }
      // TODO: implement it in less hacky way later
      defaultDataPointValueByteSize = defaultDataPointValueByteSizeTmp;

      // Validate default byte size
      // TODO: maybe remove
      require(
        defaultDataPointValueByteSize <= STANDARD_SLOT_BS,
        "Default data point value byte size must be less or equal than 32"
      );

      signedMessageBytesCount =
        uint256(dataPointsCount) *
        // dpSymbolAndValueByteSize +
        (defaultDataPointValueByteSize + DP_SYMBOL_BS) +
        DP_WITHOUT_DATA_POINTS_AND_SIG_BS;

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
          add(calldataOffset, TIMESTAMP_CALLDATA_OFFSET)
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
        {
          uint256 negativeOffsetToDataPoints;
          uint256 dataPointCalldataOffset;
          assembly {
            negativeOffsetToDataPoints := add(calldataOffset, DATAPOINTS_CALLDATA_OFFSET)
            dataPointCalldataOffset := sub(
              calldatasize(),
              add(
                negativeOffsetToDataPoints,
                mul(
                  add(1, dataPointIndex),
                  add(defaultDataPointValueByteSize, DP_SYMBOL_BS)
                )
              )
            )
            dataPointSymbol := calldataload(dataPointCalldataOffset)
            dataPointValue := getNumberFromCalldata(
              add(dataPointCalldataOffset, DP_SYMBOL_BS),
              defaultDataPointValueByteSize
            )
            // dataPointValue := calldataload(add(dataPointCalldataOffset, DP_SYMBOL_BS))

            // TODO: make it more performant and safe
            function getNumberFromCalldata(numberCalldataOffset, byteSize)
              -> extractedNumber
            {
              let numberStartOffset := sub(
                numberCalldataOffset,
                sub(STANDARD_SLOT_BS, byteSize)
              )
              extractedNumber := calldataload(numberStartOffset)
              let bitsCount := mul(
                8, // BITS_COUNT_IN_ONE_BYTE
                byteSize
              )
              extractedNumber := and(sub(MAX_INT, exp(2, bitsCount)), extractedNumber)
            }
          }
        }

        for (uint256 symbolIndex = 0; symbolIndex < symbols.length; symbolIndex++) {
          if (dataPointSymbol == symbols[symbolIndex]) {
            uint256 bitmapSignersForSymbol = signersBitmapForSymbols[symbolIndex];
            // bool currentSignerWasNotCountedForCurrentSymbol = !_getBitFromBitmap(
            //   bitmapSignersForSymbol,
            //   signerIndex
            // );

            if (
              !_getBitFromBitmap(bitmapSignersForSymbol, signerIndex) &&
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
      DP_WITHOUT_DATA_POINTS_BS +
      (defaultDataPointValueByteSize + DP_SYMBOL_BS) *
      dataPointsCount;
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
