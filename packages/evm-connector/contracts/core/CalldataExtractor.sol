// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./RedstoneConstants.sol";

contract CalldataExtractor is RedstoneConstants {
  function _extractByteSizeOfUnsignedMetadata() internal pure returns (uint256) {
    // Using uint24, because unsigned metadata byte size number has 3 bytes
    uint24 unsignedMetadataByteSize;
    assembly {
      let calldataOffset := sub(calldatasize(), REDSTONE_MARKER_BS)
      unsignedMetadataByteSize := calldataload(sub(calldataOffset, STANDARD_SLOT_BS))
    }
    return unsignedMetadataByteSize + UNSGINED_METADATA_BYTE_SIZE_BS + REDSTONE_MARKER_BS;
  }

  function _extractDataPackagesCountFromCalldata(uint256 calldataNegativeOffset)
    internal
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

  function _extractDataPointValueAndDataFeedId(
    uint256 calldataNegativeOffset,
    uint256 defaultDataPointValueByteSize,
    uint256 dataPointIndex
  ) internal pure virtual returns (bytes32 dataPointDataFeedId, uint256 dataPointValue) {
    assembly {
      let negativeOffsetToDataPoints := add(
        calldataNegativeOffset,
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
      dataPointDataFeedId := calldataload(dataPointCalldataOffset)
      dataPointValue := calldataload(add(dataPointCalldataOffset, DATA_POINT_SYMBOL_BS))
    }
  }

  function _extractDataPointsDetailsForDataPackage(
    uint256 calldataNegativeOffsetForDataPackage
  ) internal pure returns (uint256 dataPointsCount, uint256 eachDataPointValueByteSize) {
    uint24 _dataPointsCount;
    uint32 _eachDataPointValueByteSize;

    assembly {
      // Extract data points count
      let negativeCalldataOffset := add(calldataNegativeOffsetForDataPackage, SIG_BS)
      _dataPointsCount := extractFromCalldata(negativeCalldataOffset)

      // Extract each data point value size
      negativeCalldataOffset := add(negativeCalldataOffset, DATA_POINTS_COUNT_BS)
      _eachDataPointValueByteSize := extractFromCalldata(negativeCalldataOffset)

      function extractFromCalldata(negativeOffset) -> extractedValue {
        extractedValue := calldataload(
          sub(calldatasize(), add(negativeOffset, STANDARD_SLOT_BS))
        )
      }
    }

    // Prepare returned values
    dataPointsCount = uint256(_dataPointsCount);
    eachDataPointValueByteSize = uint256(_eachDataPointValueByteSize);
  }
}
