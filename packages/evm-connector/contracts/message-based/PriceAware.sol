// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

// import "hardhat/console.sol";

// import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// import "../commons/BytesLib.sol";

abstract contract PriceAware {
  // using ECDSA for bytes32;

  uint256 constant _MAX_DATA_TIMESTAMP_DELAY = 3 * 60; // 3 minutes
  uint256 constant _MAX_BLOCK_TIMESTAMP_DELAY = 15; // 15 seconds

  // Constants for better readablity of the assembly code
  uint256 constant CALLDATA_SLOT_BYTES_COUNT = 32;
  uint256 constant NEXT_FREE_MEMORY_POINTER_LOCATION = 0x40;
  uint256 constant SIGNATURE_BYTES_COUNT = 65;
  uint256 constant DATAPOINTS_NUMBER_BYTES_COUNT = 2;
  uint256 constant DATAPOINTS_NUMBER_AND_SIGNATURE_BYTES_COUNT = 67; // 65 + 2

  /* ========== VIRTUAL FUNCTIONS (MAY BE OVERRIDEN IN CHILD CONTRACTS) ========== */

  function getMaxDataTimestampDelay() public view virtual returns (uint256) {
    return _MAX_DATA_TIMESTAMP_DELAY;
  }

  function getMaxBlockTimestampDelay() public view virtual returns (uint256) {
    return _MAX_BLOCK_TIMESTAMP_DELAY;
  }

  function isSignerAuthorized(address _receviedSigner)
    public
    view
    virtual
    returns (bool);

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

  function getPriceFromMsg(bytes32 symbol) internal view returns (uint256) {
    bytes32[] memory symbols = new bytes32[](1);
    symbols[0] = symbol;
    return getPricesFromMsg(symbols)[0];
  }

  function getPricesFromMsg(bytes32[] memory symbols)
    internal
    view
    returns (uint256[] memory)
  {
    // The structure of calldata witn n - data items:
    // The data that is signed (symbols, values, timestamp) are inside the {} brackets
    // [origina_call_data| ?]{[[symbol | 32][value | 32] | n times][timestamp | 32]}[size | 1][signature | 65]

    // 0. Init helpful variables
    // uint256 calldataBytesCount = msg.data.length;

    // TODO: remove
    // bytes memory copiedCalldata = copyBytes(msg.data);
    // console.log("\nCalldata");
    // console.logBytes(copiedCalldata);

    // 1. Extracting dataPointsCount - the number of data points
    uint16 dataPointsCount; // Number of data points
    assembly {
      // Calldataload loads slots of 32 bytes
      // The last 65 bytes are for signature
      // We load the previous 32 bytes and automatically take the 2 least significant ones (casting to uint16)
      dataPointsCount := calldataload(
        sub(
          calldatasize(),
          add(SIGNATURE_BYTES_COUNT, CALLDATA_SLOT_BYTES_COUNT)
        )
      )
    }

    // 2. Calculating the size of signed message expressed in bytes
    // ((symbolLen(32) + valueLen(32)) * dataSize + timestamp bytes size
    // uint16 signedMessageBytesCount = dataPointsCount * 64 + 32; // <- previous version
    uint256 signedMessageBytesCount = dataPointsCount * 64 + 32;

    // 3. We extract the signedMessage
    // High level equivalent below (1.2k gas more expensive)
    // TODO: verify gas improvement on the final version
    // uint256 startIndex = msg.data.length -
    //   signedMessageBytesCount -
    //   DATAPOINTS_NUMBER_BYTES_COUNT -
    //   SIGNATURE_BYTES_COUNT;
    // uint256 endIndex = msg.data.length -
    //   DATAPOINTS_NUMBER_BYTES_COUNT -
    //   SIGNATURE_BYTES_COUNT;
    // bytes memory signedMessage = msg.data[startIndex:endIndex];

    // Optimised assembly version
    bytes memory signedMessage;
    assembly {
      signedMessage := mload(NEXT_FREE_MEMORY_POINTER_LOCATION)
      // Bytes arrays have the convention of the first 32 bytes storing the length of the bytes array (improve comment)
      mstore(signedMessage, signedMessageBytesCount)
      // The starting point is callDataSize minus length of data(messageLength), signature(65) and size(2) = 67
      let signedMessageBytesStartPtr := add(
        signedMessage,
        CALLDATA_SLOT_BYTES_COUNT
      )
      calldatacopy(
        signedMessageBytesStartPtr,
        sub(
          calldatasize(),
          add(
            signedMessageBytesCount,
            DATAPOINTS_NUMBER_AND_SIGNATURE_BYTES_COUNT
          )
        ),
        signedMessageBytesCount
      )

      // mstore(NEXT_FREE_MEMORY_POINTER_LOCATION, signedMessageBytesPtr) // <- old version (has memory leak)

      // new version
      mstore(
        NEXT_FREE_MEMORY_POINTER_LOCATION,
        add(signedMessageBytesStartPtr, signedMessageBytesCount)
      )
    }

    // console.log("\nsigned message part");
    // console.log("Hehe");

    // // TODO: remove
    // console.log("\nsigned message");
    // console.logBytes(signedMessage);

    // 4. We first hash the raw message and then hash it again with the prefix
    // Following the https://github.com/ethereum/eips/issues/191 standard
    bytes32 signedMessageHash = keccak256(signedMessage);
    // TODO: experiment
    bytes32 signedHash = keccak256(
      abi.encodePacked("\x19Ethereum Signed Message:\n32", signedMessageHash)
    );
    // bytes32 hashWithPrefix = signedMessageHash.toEthSignedMessageHash();
    // bytes32 hashWithPrefix = signedMessageHash;
    // console.log("\nHash to verify");
    // console.log(Strings.toHexString(uint256(hashWithPrefix), 32));

    // 5. We extract the off-chain signature from calldata

    // High level equivalent (0.5k gas more expensive)
    // TODO: verify gas improvement on the final version
    // uint256 signatureStartIndex = msg.data.length - SIGNATURE_BYTES_COUNT;
    // uint256 signatureEndIndex = msg.data.length;
    // bytes memory signature = msg.data[signatureStartIndex:signatureEndIndex];

    // Optimised assembly version
    bytes memory signature;
    assembly {
      signature := mload(NEXT_FREE_MEMORY_POINTER_LOCATION)
      mstore(signature, SIGNATURE_BYTES_COUNT)
      let signatureBytesStartPtr := add(signature, 32)
      calldatacopy(
        signatureBytesStartPtr,
        sub(calldatasize(), SIGNATURE_BYTES_COUNT),
        SIGNATURE_BYTES_COUNT
      )
      mstore(
        NEXT_FREE_MEMORY_POINTER_LOCATION,
        add(signatureBytesStartPtr, SIGNATURE_BYTES_COUNT)
      )
    }

    // TODO: remove
    // console.log("\nSignature");
    // console.logBytes(signature);

    // 6. We verify the off-chain signature against on-chain hashed data

    // Signature verification using openzeppelin library
    // address signer = hashWithPrefix.recover(signature);

    // Alternative option for signature verification (without using openzeppelin lbrary)
    // It's 0.5k gas cheaper
    bytes32 r;
    bytes32 s;
    uint8 v;
    assembly {
      r := mload(add(signature, 32))
      s := mload(add(signature, 64))
      v := and(mload(add(signature, 65)), 255)
    }
    address signer = ecrecover(signedHash, v, r, s);

    // console.log("\nSigner");
    // console.log(signer);

    require(isSignerAuthorized(signer), "Signer not authorized");

    // 7. We extract timestamp from callData

    uint256 dataTimestamp;
    assembly {
      // Calldataload loads slots of 32 bytes
      // The last 65 bytes are for signature + 1 for data size
      // We load the previous 32 bytes
      dataTimestamp := calldataload(sub(calldatasize(), 98))
    }

    // 8. We validate timestamp
    require(isTimestampValid(dataTimestamp), "Data timestamp is invalid");

    return
      _readFromCallData(
        symbols,
        uint256(dataPointsCount),
        signedMessageBytesCount
      );
  }

  function _readFromCallData(
    bytes32[] memory symbols,
    uint256 dataSize,
    uint256 messageLength
  ) private pure returns (uint256[] memory) {
    uint256[] memory values;
    uint256 i;
    uint256 j;
    uint256 readyAssets;
    bytes32 currentSymbol;

    // TODO: remove
    // values = new uint256[](1);
    // values[0] = 42 * (10**8);
    // return values;

    // We iterate directly through call data to extract the values for symbols
    assembly {
      let start := sub(calldatasize(), add(messageLength, 67))

      values := msize()
      mstore(values, mload(symbols))
      mstore(
        NEXT_FREE_MEMORY_POINTER_LOCATION,
        add(add(values, 0x20), mul(mload(symbols), 0x20))
      )

      for {
        i := 0
      } lt(i, dataSize) {
        i := add(i, 1)
      } {
        currentSymbol := calldataload(add(start, mul(i, 64)))

        for {
          j := 0
        } lt(j, mload(symbols)) {
          j := add(j, 1)
        } {
          if eq(mload(add(add(symbols, 32), mul(j, 32))), currentSymbol) {
            mstore(
              add(add(values, 32), mul(j, 32)),
              calldataload(add(add(start, mul(i, 64)), 32))
            )
            readyAssets := add(readyAssets, 1)
          }

          if eq(readyAssets, mload(symbols)) {
            i := dataSize
          }
        }
      }
    }

    return (values);
  }
}
