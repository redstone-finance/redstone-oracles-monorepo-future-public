// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

// import "hardhat/console.sol";

abstract contract RedstoneConsumerOldBase {
  uint256 constant _MAX_DATA_TIMESTAMP_DELAY = 3 * 60; // 3 minutes
  uint256 constant _MAX_BLOCK_TIMESTAMP_DELAY = 15; // 15 seconds

  // Constants for better readablity of the assembly code
  // BS - Bytes size
  // PTR - Pointer (memory location)
  // SIG - Signature
  // DP - Data point
  // DP_NUMBER - Number of data points
  uint256 constant CALLDATA_SLOT_BS = 32;
  uint256 constant FREE_MEMORY_PTR = 0x40;
  uint256 constant SIG_BS = 65;
  uint256 constant DP_NUMBER_BS = 2;
  uint256 constant DP_NUMBER_AND_SIG_BS = 67; // CALLDATA_SLOT_BS + DP_NUMBER_BS
  uint256 constant TIMESTAMP_BS = 32;
  uint256 constant TIMESTAMP_CALLDATA_OFFSET = 99; // SIG_BS + DP_NUMBER_BS + CALLDATA_SLOT_BS
  uint256 constant DP_SYMBOL_BS = 32;
  uint256 constant DP_VALUE_BS = 32;
  uint256 constant BYTES_ARR_LEN_VAR_BS = 32;
  uint256 constant DP_SYMBOL_AND_VALUE_BS = 64;
  uint256 constant ECDSA_SIG_R_BS = 32;
  uint256 constant ECDSA_SIG_S_BS = 32;
  uint256 constant ECDSA_SIG_S_OFFSET = 64; // BYTES_ARR_LEN_VAR_BS + ECDSA_SIG_R_BS
  uint256 constant ECDSA_SIG_V_OFFSET = 96; // BYTES_ARR_LEN_VAR_BS + ECDSA_SIG_R_BS + ECDSA_SIG_S_BS

  /* ========== VIRTUAL FUNCTIONS (MAY BE OVERRIDEN IN CHILD CONTRACTS) ========== */

  function getMaxDataTimestampDelay() public view virtual returns (uint256) {
    return _MAX_DATA_TIMESTAMP_DELAY;
  }

  function getMaxBlockTimestampDelay() public view virtual returns (uint256) {
    return _MAX_BLOCK_TIMESTAMP_DELAY;
  }

  function isSignerAuthorized(address _receviedSigner) public view virtual returns (bool);

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
    // The structure of calldata witn n - data items:
    // The data that is signed (symbols, values, timestamp) are inside the {} brackets
    // [origina_call_data| ?]{[[symbol | 32][value | 32] | n times][timestamp | 32]}[size | 1][signature | 65]

    // 1. Extracting dataPointsCount - the number of data points

    uint16 dataPointsCount; // Number of data points
    assembly {
      // Calldataload loads slots of 32 bytes
      // The last 65 bytes are for signature
      // We load the previous 32 bytes and automatically take the 2 least significant ones (casting to uint16)
      dataPointsCount := calldataload(sub(calldatasize(), add(SIG_BS, CALLDATA_SLOT_BS)))
    }

    // 2. Calculating the size of signed message expressed in bytes

    uint256 signedMessageBytesCount = uint256(dataPointsCount) *
      DP_SYMBOL_AND_VALUE_BS +
      TIMESTAMP_BS;

    // 3. We extract the signedMessage

    // High level equivalent below (1.2k gas more expensive)
    // uint256 startIndex = msg.data.length -
    //   signedMessageBytesCount -
    //   DP_NUMBERBER_BS -
    //   SIG_BS;
    // uint256 endIndex = msg.data.length -
    //   DP_NUMBERBER_BS -
    //   SIG_BS;
    // bytes memory signedMessage = msg.data[startIndex:endIndex];

    // Optimised assembly version
    bytes memory signedMessage;
    assembly {
      signedMessage := mload(FREE_MEMORY_PTR)
      mstore(signedMessage, signedMessageBytesCount)
      let signedMessageBytesStartPtr := add(signedMessage, CALLDATA_SLOT_BS)
      calldatacopy(
        signedMessageBytesStartPtr,
        sub(calldatasize(), add(signedMessageBytesCount, DP_NUMBER_AND_SIG_BS)),
        signedMessageBytesCount
      )

      // mstore(FREE_MEMORY_PTR, signedMessageBytesPtr) // <- old version (has memory leak)

      // New version (without memory leak)
      mstore(FREE_MEMORY_PTR, add(signedMessageBytesStartPtr, signedMessageBytesCount))
    }

    // 4. We first hash the raw message and then hash it again with the prefix

    // 4.V1 - with ethereum prefix (default signMessage in ethereum)
    // More info here: https://github.com/ethereum/eips/issues/191
    // bytes32 signedMessageHash = keccak256(signedMessage);
    // bytes32 signedHash = keccak256(
    //   abi.encodePacked("\x19Ethereum Signed Message:\n32", signedMessageHash)
    // );

    // 4.V2 - without ethereum prefix (0.5k gas cheaper)
    bytes32 signedHash = keccak256(signedMessage);

    // 5. We extract the off-chain signature from calldata

    // High level equivalent (0.5k gas more expensive)
    // uint256 signatureStartIndex = msg.data.length - SIG_BS;
    // uint256 signatureEndIndex = msg.data.length;
    // bytes memory signature = msg.data[signatureStartIndex:signatureEndIndex];

    // Optimised assembly version
    bytes memory signature;
    assembly {
      signature := mload(FREE_MEMORY_PTR)
      mstore(signature, SIG_BS)
      let signatureBytesStartPtr := add(signature, BYTES_ARR_LEN_VAR_BS)
      calldatacopy(signatureBytesStartPtr, sub(calldatasize(), SIG_BS), SIG_BS)
      mstore(FREE_MEMORY_PTR, add(signatureBytesStartPtr, SIG_BS))
    }

    // 6. We verify the off-chain signature against on-chain hashed data

    // Signature verification using openzeppelin library (0.5k gas more expensive)
    // address signer = hashWithPrefix.recover(signature);

    // Alternative option for signature verification (without using openzeppelin lbrary)
    address signer = _recoverSignerAddress(signedHash, signature);

    require(isSignerAuthorized(signer), "Signer not authorized");

    // 7. We extract timestamp from callData
    uint256 dataTimestamp;
    assembly {
      let timestampStartIndex := sub(calldatasize(), TIMESTAMP_CALLDATA_OFFSET)
      dataTimestamp := calldataload(timestampStartIndex)
    }

    // 8. We validate timestamp
    require(isTimestampValid(dataTimestamp), "Data timestamp is invalid");

    // 9. We extract values for the requested symbols and return them
    return _readFromCallData(symbols, uint256(dataPointsCount), signedMessageBytesCount);
  }

  function _recoverSignerAddress(bytes32 signedHash, bytes memory signature)
    private
    pure
    returns (address)
  {
    bytes32 r;
    bytes32 s;
    uint8 v;
    assembly {
      r := mload(add(signature, BYTES_ARR_LEN_VAR_BS))
      s := mload(add(signature, ECDSA_SIG_S_OFFSET))
      v := byte(0, mload(add(signature, ECDSA_SIG_V_OFFSET))) // last byte of the signature memoty array
    }
    return ecrecover(signedHash, v, r, s);
  }

  function _readFromCallData(
    bytes32[] memory symbols,
    uint256 dataPointsCount,
    uint256 messageLength
  ) private pure returns (uint256[] memory) {
    uint256[] memory values;
    uint256 dataPointIndex;
    uint256 symbolIndex;
    uint256 readyAssetsCount;

    // Iterating through calldata to get variables for the requested symbols
    assembly {
      let redstoneAppendixByteSize := add(messageLength, DP_NUMBER_AND_SIG_BS)
      let calldataStartIndex := sub(calldatasize(), redstoneAppendixByteSize) // start index in calldata for RedStone appendix

      // Allocating memory for the result array with values
      values := mload(FREE_MEMORY_PTR)
      let symbolsCount := mload(symbols)
      mstore(values, symbolsCount)
      let totalValuesArrayByteSize := add(
        BYTES_ARR_LEN_VAR_BS,
        mul(symbolsCount, DP_VALUE_BS)
      )
      let updatedFreeMemoryPtr := add(values, totalValuesArrayByteSize)
      mstore(FREE_MEMORY_PTR, updatedFreeMemoryPtr)

      for {
        dataPointIndex := 0
      } lt(dataPointIndex, dataPointsCount) {
        dataPointIndex := add(dataPointIndex, 1) // dataPointIndex++
      } {
        let dataPointSymbol := calldataload(
          add(calldataStartIndex, mul(dataPointIndex, DP_SYMBOL_AND_VALUE_BS))
        )

        for {
          symbolIndex := 0
        } lt(symbolIndex, symbolsCount) {
          symbolIndex := add(symbolIndex, 1) // symbolIndex++
        } {
          let currentSymbolOffset := add(
            BYTES_ARR_LEN_VAR_BS,
            mul(symbolIndex, DP_SYMBOL_BS)
          )
          let currentSymbolPtr := add(symbols, currentSymbolOffset)
          let currentSymbol := mload(currentSymbolPtr)

          if eq(currentSymbol, dataPointSymbol) {
            // Extract current value from calldata
            let currentValue := calldataload(
              add(
                add(calldataStartIndex, mul(dataPointIndex, DP_SYMBOL_AND_VALUE_BS)),
                DP_SYMBOL_BS
              )
            )

            // Save current value to the values array
            let currentValueOffset := add(
              BYTES_ARR_LEN_VAR_BS,
              mul(symbolIndex, DP_VALUE_BS)
            )
            let currentValuePtr := add(values, currentValueOffset)
            mstore(currentValuePtr, currentValue)

            // Increment counter by 1
            readyAssetsCount := add(readyAssetsCount, 1)
          }

          // Breaking the loop after extracting enough symbols
          if eq(readyAssetsCount, symbolsCount) {
            dataPointIndex := dataPointsCount
          }
        }
      }
    }

    return values;
  }
}
