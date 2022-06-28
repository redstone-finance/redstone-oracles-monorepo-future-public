// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerMockV4.sol";
import "../commons/NumericArrayLib.sol";
import "hardhat/console.sol";

contract SampleRedstoneConsumerMockV4 is RedstoneConsumerMockV4 {
  uint256 constant BITS_COUNT_IN_ONE_BYTE = 8;

  uint256 public latestPrice;

  function aggregateValues(bytes[] memory values)
    public
    pure
    override
    returns (bytes memory)
  {
    uint256[] memory numericValues = new uint256[](values.length);
    for (uint256 i = 0; i < values.length; i++) {
      numericValues[i] = bytesToUint256(values[i]);
    }

    uint256 numericAggregatedResult = NumericArrayLib.pickMedian(numericValues);
    bytes memory aggregatedResult = abi.encodePacked(numericAggregatedResult);

    // convert uint256 to bytes
    return aggregatedResult;
  }

  function getPriceSecurely(bytes32 symbol) public view returns (uint256) {
    bytes memory bytesValueFromOracle = getOracleValueFromTxMsg(symbol);
    return bytesToUint256(bytesValueFromOracle);
  }

  function saveLatestPriceInStorage(bytes32 symbol) public {
    bytes memory bytesValueFromOracle = getOracleValueFromTxMsg(symbol);
    latestPrice = bytesToUint256(bytesValueFromOracle);
  }

  function bytesToUint256(bytes memory bytesValue)
    private
    pure
    returns (uint256 uintValue)
  {
    assembly {
      let byteSize := mload(bytesValue)
      let bitSize := mul(byteSize, BITS_COUNT_IN_ONE_BYTE)

      // Cast to number (ignore superfluous bytes)
      // uintValue := and(
      //   sub(shl(mul(byteSize, BITS_COUNT_IN_ONE_BYTE), 1), 1),
      //   mload(add(bytesValue, BYTES_ARR_LEN_VAR_BS))
      // )

      uintValue := shr(sub(256, bitSize), mload(add(bytesValue, BYTES_ARR_LEN_VAR_BS)))

      // uintValue := mload(add(bytesValue, BYTES_ARR_LEN_VAR_BS))
    }
  }
}
