// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

// import "hardhat/console.sol";

import "./RedstoneConsumerBaseV2.sol";

abstract contract RedstoneConsumerBaseV5 is RedstoneConsumerBaseV2 {
  uint256 constant BITS_COUNT_IN_16_BYTES = 128;

  function getCalldataBytesFromCalldataPointer(uint256 byteValueCalldataPtr)
    internal
    pure
    returns (bytes calldata bytesValueInCalldata)
  {
    uint256 calldataOfffset = _getNumberFromFirst16Bytes(byteValueCalldataPtr);
    uint256 valueByteSize = _getNumberFromLast16Bytes(byteValueCalldataPtr);

    assembly {
      bytesValueInCalldata.offset := calldataOfffset
      bytesValueInCalldata.length := valueByteSize
    }
  }

  function aggregateValues(uint256[] memory calldataPointersToValues)
    public
    view
    override
    returns (uint256 pointerToResultBytesInMemory)
  {
    bytes memory aggregatedBytes = aggregateByteValues(calldataPointersToValues);
    assembly {
      pointerToResultBytesInMemory := aggregatedBytes
    }
  }

  // This method can be overriden by client to specify their
  // custom logic of bytes aggregation
  function aggregateByteValues(uint256[] memory calldataPointersForValues)
    public
    view
    virtual
    returns (bytes memory)
  {
    // Check if all byte arrays are identical
    bytes calldata firstValue = getCalldataBytesFromCalldataPointer(
      calldataPointersForValues[0]
    );
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

  function getOracleBytesValueFromTxMsg(bytes32 symbol)
    internal
    view
    returns (bytes memory)
  {
    bytes32[] memory symbols = new bytes32[](1);
    symbols[0] = symbol;
    return getOracleBytesValuesFromTxMsg(symbols)[0];
  }

  // This is the core logic for pointers extraction
  function getOracleBytesValuesFromTxMsg(bytes32[] memory symbols)
    internal
    view
    returns (bytes[] memory arrayOfMemoryPointers)
  {
    // _securelyExtractOracleValuesFromTxMsg contains the main logic
    // for the data extraction and validation
    uint256[] memory arrayOfExtractedValues = _securelyExtractOracleValuesFromTxMsg(
      symbols
    );
    assembly {
      arrayOfMemoryPointers := arrayOfExtractedValues
    }
  }

  function _getDataPointValueByteSize(uint256 calldataOffset)
    internal
    pure
    override
    returns (uint256)
  {
    uint24 defaultDataPointValueByteSize;
    assembly {
      // Extracting the number of data points
      let negativeOffset := add(calldataOffset, add(SIG_BS, STANDARD_SLOT_BS))

      // Extracting the default data point value byte size
      defaultDataPointValueByteSize := calldataload(
        sub(sub(calldatasize(), negativeOffset), DATA_POINTS_COUNT_BS)
      )
    }
    return uint256(defaultDataPointValueByteSize);
  }

  function _extractDataPointValueAndSymbol(
    uint256 calldataOffset,
    uint256 defaultDataPointValueByteSize,
    uint256 dataPointIndex
  ) internal pure override returns (bytes32 dataPointSymbol, uint256 dataPointValue) {
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
      dataPointValue := prepareTrickyCalldataPointer(
        add(dataPointCalldataOffset, DATA_POINT_SYMBOL_BS),
        defaultDataPointValueByteSize
      )

      function prepareTrickyCalldataPointer(calldataOffsetArg, valueByteSize)
        -> calldataPtr
      {
        calldataPtr := add(shl(BITS_COUNT_IN_16_BYTES, calldataOffsetArg), valueByteSize)
      }
    }
  }

  function getOracleValueFromTxMsg(bytes32 symbol)
    internal
    pure
    override
    returns (uint256)
  {
    symbol; // To handle compilation warning
    revert(
      "function getOracleValueFromTxMsg should not be used in the current contract version"
    );
  }

  function getOracleValuesFromTxMsg(bytes32[] memory symbols)
    internal
    pure
    override
    returns (uint256[] memory)
  {
    symbols; // To handle compilation warning
    revert(
      "function getOracleValuesFromTxMsg should not be used in the current contract version"
    );
  }

  function _getNumberFromFirst16Bytes(uint256 number) internal pure returns (uint256) {
    return uint256(number >> BITS_COUNT_IN_16_BYTES);
  }

  function _getNumberFromLast16Bytes(uint256 number) internal pure returns (uint256) {
    return uint256((number << BITS_COUNT_IN_16_BYTES) >> BITS_COUNT_IN_16_BYTES);
  }
}
