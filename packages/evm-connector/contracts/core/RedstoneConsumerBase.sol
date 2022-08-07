// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./RedstoneConstants.sol";
import "./RedstoneDefaultsLib.sol";
import "./CalldataExtractor.sol";
import "../libs/BitmapLib.sol";
import "../libs/SignatureLib.sol";

abstract contract RedstoneConsumerBase is RedstoneConstants, CalldataExtractor {
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
    bytes32[] memory dataFeedIds = new bytes32[](1);
    dataFeedIds[0] = symbol;
    return getOracleNumericValuesFromTxMsg(dataFeedIds)[0];
  }

  function getOracleNumericValuesFromTxMsg(bytes32[] memory dataFeedIds)
    internal
    view
    virtual
    returns (uint256[] memory)
  {
    return _securelyExtractOracleValuesFromTxMsg(dataFeedIds);
  }

  function _securelyExtractOracleValuesFromTxMsg(bytes32[] memory dataFeedIds)
    internal
    view
    returns (uint256[] memory)
  {
    // Initializing helpful variables and allocating memory
    uint256[] memory uniqueSignerCountForDataFeedIds = new uint256[](dataFeedIds.length);
    uint256[] memory signersBitmapForDataFeedIds = new uint256[](dataFeedIds.length);
    uint256[][] memory valuesForDataFeedIds = new uint256[][](dataFeedIds.length);
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      signersBitmapForDataFeedIds[i] = 0; // empty bitmap
      valuesForDataFeedIds[i] = new uint256[](uniqueSignersThreshold);
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
        dataFeedIds,
        uniqueSignerCountForDataFeedIds,
        signersBitmapForDataFeedIds,
        valuesForDataFeedIds,
        calldataNegativeOffset
      );
      calldataNegativeOffset += dataPackageByteSize;
    }

    // Validating numbers of unique signers and calculating aggregated values for each symbol
    return
      _getAggregatedValues(
        dataFeedIds.length,
        valuesForDataFeedIds,
        uniqueSignerCountForDataFeedIds
      );
  }

  function _extractDataPackage(
    bytes32[] memory dataFeedIds,
    uint256[] memory uniqueSignerCountForDataFeedIds,
    uint256[] memory signersBitmapForDataFeedIds,
    uint256[][] memory valuesForDataFeedIds,
    uint256 calldataNegativeOffset
  ) private view returns (uint256) {
    uint256 signerIndex;

    (
      uint256 dataPointsCount,
      uint256 eachDataPointValueByteSize
    ) = _extractDataPointsDetailsForDataPackage(calldataNegativeOffset);

    // We use scopes to resolve problem with too deep stack
    {
      uint48 extractedTimestamp;
      address signerAddress;
      bytes32 signedHash;
      bytes memory signedMessage;
      uint256 signedMessageBytesCount;

      signedMessageBytesCount =
        dataPointsCount *
        (eachDataPointValueByteSize + DATA_POINT_SYMBOL_BS) +
        DATA_PACKAGE_WITHOUT_DATA_POINTS_AND_SIG_BS;

      assembly {
        // Extracting the signed message
        signedMessage := extractBytesFromCalldata(
          add(calldataNegativeOffset, SIG_BS),
          signedMessageBytesCount
        )

        // Hashing the signed message
        signedHash := keccak256(
          add(signedMessage, BYTES_ARR_LEN_VAR_BS),
          signedMessageBytesCount
        )

        // Extracting timestamp
        extractedTimestamp := extractValueFromCalldata(
          add(calldataNegativeOffset, TIMESTAMP_NEGATIVE_OFFSET_IN_DATA_PACKAGE)
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
        calldataNegativeOffset + SIG_BS
      );
      signerIndex = getAuthorisedSignerIndex(signerAddress);
    }

    // Updating helpful arrays
    {
      bytes32 dataPointDataFeedId;
      uint256 dataPointValue;
      for (
        uint256 dataPointIndex = 0;
        dataPointIndex < dataPointsCount;
        dataPointIndex++
      ) {
        // Extracting symbol and value for current data point
        (dataPointDataFeedId, dataPointValue) = _extractDataPointValueAndDataFeedId(
          calldataNegativeOffset,
          eachDataPointValueByteSize,
          dataPointIndex
        );

        for (uint256 symbolIndex = 0; symbolIndex < dataFeedIds.length; symbolIndex++) {
          if (dataPointDataFeedId == dataFeedIds[symbolIndex]) {
            uint256 bitmapSignersForDataFeedId = signersBitmapForDataFeedIds[symbolIndex];

            if (
              !BitmapLib.getBitFromBitmap(bitmapSignersForDataFeedId, signerIndex) && /* current signer was not counted for current symbol */
              uniqueSignerCountForDataFeedIds[symbolIndex] < uniqueSignersThreshold
            ) {
              // Increase unique signer counter
              uniqueSignerCountForDataFeedIds[symbolIndex]++;

              // Add new value
              valuesForDataFeedIds[symbolIndex][
                uniqueSignerCountForDataFeedIds[symbolIndex] - 1
              ] = dataPointValue;

              // Update signers bitmap
              signersBitmapForDataFeedIds[symbolIndex] = BitmapLib.setBitInBitmap(
                bitmapSignersForDataFeedId,
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
      (eachDataPointValueByteSize + DATA_POINT_SYMBOL_BS) *
      dataPointsCount;
  }

  function _getAggregatedValues(
    uint256 dataFeedIdsLength,
    uint256[][] memory valuesForDataFeedIds,
    uint256[] memory uniqueSignerCountForDataFeedIds
  ) internal view returns (uint256[] memory) {
    uint256[] memory aggregatedValues = new uint256[](dataFeedIdsLength);

    for (uint256 symbolIndex = 0; symbolIndex < dataFeedIdsLength; symbolIndex++) {
      require(
        uniqueSignerCountForDataFeedIds[symbolIndex] >= uniqueSignersThreshold,
        "Insufficient number of unique signers"
      );
      uint256 aggregatedValueForDataFeedId = aggregateValues(
        valuesForDataFeedIds[symbolIndex]
      );
      aggregatedValues[symbolIndex] = aggregatedValueForDataFeedId;
    }

    return aggregatedValues;
  }
}
