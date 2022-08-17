// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./RedstoneConsumerBase.sol";

/**
 * @title The base contract for Redstone consumers' contracts that allows to
 * securely calculate dynamic (array of bytes) redstone oracle values
 * @author The Redstone Oracles team
 *
 * @dev This contract can extend other contracts to allow them
 * securely fetch Redstone oracle data from tx calldata in a form of byte arrays.
 *
 * Note! If you want to use numeric values, use RedstoneConsumerNumericBase contract
 *
 * We wanted to reuse the core logic from the RedstoneConsumerBase contract, but it
 * required few tricks, which are described below:
 *
 * 1. "Tricky" calldata pointers - we decided to use single uint256 values and store
 * the calldata offset in the first 128 bits of those numbers, and the value byte size
 * in the last 128 bits of the value. It allowed us to reuse a big part of core logic
 * and even slightly optimised memory usage. To optimise gas costs, we left the burden
 * of converting tricky calldata pointers to calldata bytes arrays on the consumer
 * contracts developers. They can use a helpful `getCalldataBytesFromCalldataPointer`
 * function for it
 *
 * 2. Returning memory pointers instead of actual values - we need to work with
 * dynamic bytes arrays in this contract, but the core logic of RedstoneConsumerBase
 * contract expects a uint256 number as a result of values aggregation. That's
 * why we swtiched to returning a memory pointers instead of actual values. But this is
 * more an implementation detail and should not affect end developers during the
 * integration with the Redstone protocol
 */
abstract contract RedstoneConsumerBytesBase is RedstoneConsumerBase {
  uint256 constant BITS_COUNT_IN_16_BYTES = 128;

  /**
   * @dev This function may be overriden by the child consumer contract.
   * It should aggregate values from different signers into a bytes array
   * By default, it checks if all the values are identical and returns the first one
   *
   * @param calldataPointersForValues An array of "tricky" calldata pointers to
   * the values provided by different authorised signers. Each tricky calldata pointer
   * is a uint256 number, first 128 bits of which represent calldata offset, and the
   * last 128 bits - the byte length of the value
   *
   * @return Result of the aggregation in the form of a bytes array
   */
  function aggregateByteValues(uint256[] memory calldataPointersForValues) public view virtual returns (bytes memory) {
    // Check if all byte arrays are identical
    bytes calldata firstValue = getCalldataBytesFromCalldataPointer(calldataPointersForValues[0]);
    bytes32 expectedHash = keccak256(firstValue);

    for (uint256 i = 1; i < calldataPointersForValues.length; i++) {
      bytes calldata currentValue = getCalldataBytesFromCalldataPointer(
        calldataPointersForValues[i]
      );
      require(
        keccak256(currentValue) == expectedHash,
        "Each authorised signer must provide exactly the same bytes value"
      );
    }

    return firstValue;
  }

  /**
   * @dev This function may be used to convert a "tricky" calldata pointer into a
   * calldata bytes array. You may find it useful while overriding the
   * `aggregateByteValues` function
   *
   * @param byteValueCalldataPtr A "tricky" calldata pointer, 128 first bits of which
   * represent the offset, and the last 128 bits - the byte length of the value
   *
   * @return bytesValueInCalldata The corresponding calldata bytes array
   */
  function getCalldataBytesFromCalldataPointer(uint256 byteValueCalldataPtr)
    internal
    pure
    returns (bytes calldata bytesValueInCalldata)
  {
    uint256 calldataOfffset = _getNumberFromFirst128Bits(byteValueCalldataPtr);
    uint256 valueByteSize = _getNumberFromLast128Bits(byteValueCalldataPtr);

    assembly {
      bytesValueInCalldata.offset := calldataOfffset
      bytesValueInCalldata.length := valueByteSize
    }
  }

  /**
   * @dev This function can be used in a consumer contract to securely extract an
   * oracle value for a given data feed id. Security is achieved by
   * signatures verification, timestamp validation, and aggregating bytes values
   * from different authorised signers into a single bytes array. If any of the
   * required conditions do not match, the function will revert.
   * Note! This function expects that tx calldata contains redstone payload in the end
   * Learn more about redstone payload here: https://github.com/redstone-finance/redstone-oracles-monorepo/tree/main/packages/evm-connector#readme
   * @param dataFeedId bytes32 value that uniquely identifies the data feed
   * @return Bytes array with the aggregated oracle value for the given data feed id
   */
  function getOracleBytesValueFromTxMsg(bytes32 dataFeedId) internal view returns (bytes memory) {
    bytes32[] memory dataFeedIds = new bytes32[](1);
    dataFeedIds[0] = dataFeedId;
    return getOracleBytesValuesFromTxMsg(dataFeedIds)[0];
  }

  /**
   * @dev This function can be used in a consumer contract to securely extract several
   * numeric oracle values for a given array of data feed ids. Security is achieved by
   * signatures verification, timestamp validation, and aggregating values
   * from different authorised signers into a single numeric value. If any of the
   * required conditions do not match, the function will revert.
   * Note! This function expects that tx calldata contains redstone payload in the end
   * Learn more about redstone payload here: https://github.com/redstone-finance/redstone-oracles-monorepo/tree/main/packages/evm-connector#readme
   * @param dataFeedIds An array of unique data feed identifiers
   * @return arrayOfMemoryPointers TODO
   */
  function getOracleBytesValuesFromTxMsg(bytes32[] memory dataFeedIds) internal view returns (bytes[] memory arrayOfMemoryPointers) {
    // The `_securelyExtractOracleValuesFromTxMsg` function contains the main logic
    // for the data extraction and validation
    uint256[] memory arrayOfExtractedValues = _securelyExtractOracleValuesFromTxMsg(dataFeedIds);
    assembly {
      arrayOfMemoryPointers := arrayOfExtractedValues
    }
  }

  /**
   * @dev This is a helpful function for the values aggregation
   * Unlike in the RedstoneConsumerBase contract, you should not override
   * this function. If you want to have a custom aggregation logic, you can
   * override the `aggregateByteValues` instead
   *
   * Note! Unlike in the `RedstoneConsumerBase` this function returns a memory pointer
   * to the aggregated bytes array value (instead the value itself)
   *
   * @param calldataPointersToValues An array of "tricky" calldata pointers to
   * the values provided by different authorised signers. Each tricky calldata pointer
   * is a uint256 number, first 128 bits of which represent calldata offset, and the
   * last 128 bits - the byte length of the value
   *
   * @return pointerToResultBytesInMemory A memory pointer to the aggregated bytes array
   */
  function aggregateValues(uint256[] memory calldataPointersToValues) public view override returns (uint256 pointerToResultBytesInMemory) {
    bytes memory aggregatedBytes = aggregateByteValues(calldataPointersToValues);
    assembly {
      pointerToResultBytesInMemory := aggregatedBytes
    }
  }

  /**
   * @dev This function extracts details for a given data point and returns its dataFeedId,
   * and a "tricky" calldata pointer for its value
   *
   * @param calldataNegativeOffsetForDataPackage Calldata offset for the requested data package
   * @param dataPointValueByteSize Expected number of bytes for the requested data point value
   * @param dataPointIndex Index of the requested data point
   *
   * @return dataPointDataFeedId a data feed identifier for the extracted data point
   * @return dataPointValue a "tricky" calldata pointer for the extracted value
   */
  function _extractDataPointValueAndDataFeedId(
    uint256 calldataNegativeOffsetForDataPackage,
    uint256 dataPointValueByteSize,
    uint256 dataPointIndex
  ) internal pure override returns (bytes32 dataPointDataFeedId, uint256 dataPointValue) {
    assembly {
      let negativeOffsetToDataPoints := add(
        calldataNegativeOffsetForDataPackage,
        DATA_PACKAGE_WITHOUT_DATA_POINTS_BS
      )
      let dataPointCalldataOffset := sub(
        calldatasize(),
        add(
          negativeOffsetToDataPoints,
          mul(add(1, dataPointIndex), add(dataPointValueByteSize, DATA_POINT_SYMBOL_BS))
        )
      )
      dataPointDataFeedId := calldataload(dataPointCalldataOffset)
      dataPointValue := prepareTrickyCalldataPointer(
        add(dataPointCalldataOffset, DATA_POINT_SYMBOL_BS),
        dataPointValueByteSize
      )

      function prepareTrickyCalldataPointer(calldataOffsetArg, valueByteSize) -> calldataPtr {
        calldataPtr := add(shl(BITS_COUNT_IN_16_BYTES, calldataOffsetArg), valueByteSize)
      }
    }
  }

  /// @dev This is a helpful function for "tricky" calldata pointers
  function _getNumberFromFirst128Bits(uint256 number) internal pure returns (uint256) {
    return uint256(number >> 128);
  }

  /// @dev This is a helpful function for "tricky" calldata pointers
  function _getNumberFromLast128Bits(uint256 number) internal pure returns (uint256) {
    return uint256((number << 128) >> 128);
  }
}
