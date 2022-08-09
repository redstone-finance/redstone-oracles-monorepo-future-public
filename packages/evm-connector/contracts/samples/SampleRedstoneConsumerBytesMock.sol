// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerBytesMock.sol";
import "../libs/NumericArrayLib.sol";
import "hardhat/console.sol";

contract SampleRedstoneConsumerBytesMock is RedstoneConsumerBytesMock {
  uint256 constant BITS_COUNT_IN_ONE_BYTE = 8;

  uint256 public latestSavedValue;

  function aggregateByteValues(uint256[] memory calldataPointersForValues)
    public
    pure
    override
    returns (bytes memory)
  {
    uint256[] memory numericValues = new uint256[](calldataPointersForValues.length);
    for (uint256 i = 0; i < calldataPointersForValues.length; i++) {
      bytes calldata bytesValue = getCalldataBytesFromCalldataPointer(
        calldataPointersForValues[i]
      );
      numericValues[i] = calldataBytesToUint256(bytesValue);
    }

    uint256 numericAggregatedResult = NumericArrayLib.pickMedian(numericValues);
    bytes memory aggregatedResult = abi.encodePacked(numericAggregatedResult);

    // convert uint256 to bytes
    return aggregatedResult;
  }

  function getValueSecurely(bytes32 dataFeedId) public view returns (uint256) {
    bytes memory bytesValueFromOracle = getOracleBytesValueFromTxMsg(dataFeedId);
    return bytesToUint256(bytesValueFromOracle);
  }

  function saveOracleValueInContractStorage(bytes32 dataFeedId) public {
    bytes memory bytesValueFromOracle = getOracleBytesValueFromTxMsg(dataFeedId);
    latestSavedValue = bytesToUint256(bytesValueFromOracle);
  }

  function calldataBytesToUint256(bytes calldata bytesValue)
    private
    pure
    returns (uint256 uintValue)
  {
    assembly {
      let byteSize := bytesValue.length
      let bitSize := mul(byteSize, BITS_COUNT_IN_ONE_BYTE)

      uintValue := shr(sub(256, bitSize), calldataload(bytesValue.offset))
    }
  }

  function bytesToUint256(bytes memory bytesValue) private pure returns (uint256 uintValue) {
    assembly {
      let byteSize := mload(bytesValue)
      let bitSize := mul(byteSize, BITS_COUNT_IN_ONE_BYTE)

      uintValue := shr(sub(256, bitSize), mload(add(bytesValue, BYTES_ARR_LEN_VAR_BS)))
    }
  }
}
