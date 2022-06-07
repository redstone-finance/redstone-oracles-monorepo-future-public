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
  // DP - Data point
  // DP_NUMBER - Number of data points
  uint256 constant CALLDATA_SLOT_BS = 32;
  uint256 constant FREE_MEMORY_PTR = 0x40;
  uint256 constant SIG_BS = 65;
  uint256 constant DATA_PACKAGES_NUMBER_BS = 2;
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
  uint256 constant FUNCTION_SIGNATURE_BS = 4;

  // bytes32 constant IS_TIMESTAMP_VALID_FUNC_SIG = bytes32(0x1234);
  // bytes32 constant IS_SIGNER_AUTHORISED_FUNC_SIG = bytes32(0x1234);

  /* ========== VIRTUAL FUNCTIONS (MAY BE OVERRIDEN IN CHILD CONTRACTS) ========== */

  function getMaxDataTimestampDelay() public view virtual returns (uint256) {
    return _MAX_DATA_TIMESTAMP_DELAY;
  }

  function getMaxBlockTimestampDelay() public view virtual returns (uint256) {
    return _MAX_BLOCK_TIMESTAMP_DELAY;
  }

  function isSignerAuthorized(address _receviedSigner) public view virtual returns (bool);

  function isTimestampValid(uint256 _receivedTimestamp) public view virtual returns (bool) {
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
  function aggregateValues(uint256[] memory values) public view virtual returns (uint256) {
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
    assertUniqueSymbols(symbols);

    uint16 dataPackagesCount;
    uint16 dataPointsCount;
    uint256 signedMessageBytesCount;
    uint256 calldataOffset = 0;
    uint256 symbolsLength = symbols.length;
    // address currentSigner;
    bytes32 signedHash;
    // uint256 dataTimestamp;
    bytes memory signedMessage;
    // bytes memory signature;

    // bool isSignerAuthorizedResult;
    // assembly {

    // }

    bool isTimestampValidResult = false;
    bool isSignerAuthorisedResult = false;
    console.log("isTimestampValidResult - before", isTimestampValidResult);
    console.log("isSignerAuthorisedResult - before", isSignerAuthorisedResult);

    // string memory invalidFuncCallInAssembly = "Invalid func call in assembly";

    // bytes memory isSignerAuthorizedFunctionSignature = abi.encodeWithSelector(
    //   this.isSignerAuthorized.selector
    // );
    // bytes memory isTimestampValidFunctionSignature = abi.encodeWithSelector(
    //   this.isTimestampValid.selector
    // );

    bytes4 isSignerAuthorizedFunctionSignature = hex"11c89b10"; // first 4 bytes of keccak256("isSignerAuthorized(address)")
    bytes4 isTimestampValidFunctionSignature = hex"75058205"; // first 4 bytes of keccak256("isTimestampValid(uint256)")

    // bytes memory isSignerAuthorizedFunctionSignature = new bytes(4);
    // isSignerAuthorizedFunctionSignature =

    // console.logBytes(isSignerAuthorizedFunctionSignature);
    // console.logBytes(isTimestampValidFunctionSignature);

    assembly {
      isTimestampValidResult := callViewOrPureFunction1(
        isTimestampValidFunctionSignature,
        1654562445
      )
      isSignerAuthorisedResult := callViewOrPureFunction1(
        isSignerAuthorizedFunctionSignature,
        0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
        // 0xabcFd6e51aad88F6F4ce6aB8827279cffFb92266
      )

      // --------------------------------- Functions ---------------------------------

      // Inspired by: https://ethereum.stackexchange.com/a/6363
      // TODO: take a look here: https://ethereum.stackexchange.com/questions/124636/set-data-for-call-delegatecall-etc-in-yul-inline-assembly
      function callViewOrPureFunction1(funcSignature, arg1) -> funcResult {
        let workingMemory := mload(FREE_MEMORY_PTR)
        mstore(workingMemory, add(funcSignature, BYTES_ARR_LEN_VAR_BS))
        mstore(add(workingMemory, FUNCTION_SIGNATURE_BS), arg1)
        let gasLeft := gas()
        let thisContractAddr := address()
        let inputs := workingMemory
        let output := workingMemory // save func response to the same memory that we used for inputs (saves gas) // TODO: maybe it's not applicable to every function
        let inputsByteSize := add(FUNCTION_SIGNATURE_BS, 32) // assuming that argument size is 32

        let success := staticcall(
          gasLeft,
          thisContractAddr,
          inputs,
          inputsByteSize,
          output,
          32 // assuming that output byte size is 32
        )

        // if not(success) {
        //   let resultSize := mload(output)
        //   revert(add(BYTES_ARR_LEN_VAR_BS, output), resultSize)
        // }

        funcResult := mload(output)
        // mstore(FREE_MEMORY_PTR, add(workingMemory, inputByteSize)) // <- looks like it's not needed
      }
    }
    console.log("isTimestampValidResult - after", isTimestampValidResult);
    console.log("isSignerAuthorisedResult - after", isSignerAuthorisedResult);

    assembly {
      // Allocating reusable memory for signature
      // signature := mload(FREE_MEMORY_PTR)
      // let signatureBytesStartPtr := add(signature, BYTES_ARR_LEN_VAR_BS)
      // mstore(signature, SIG_BS)
      // mstore(FREE_MEMORY_PTR, add(signatureBytesStartPtr, SIG_BS))

      // Extracting the number of data packages in tx calldata
      dataPackagesCount := calldataload(sub(calldatasize(), CALLDATA_SLOT_BS))
      calldataOffset := add(calldataOffset, DATA_PACKAGES_NUMBER_BS)
    }

    // TODO: remove
    console.log("Data packages count", dataPackagesCount);

    // Initialising helpful arrays and allocating memory for them
    uint256[] memory uniqueSignerCountForSymbols = new uint256[](symbolsLength);
    address[][] memory signersForSymbols = new address[][](symbolsLength);
    uint256[][] memory valuesForSymbols = new uint256[][](symbolsLength);
    for (uint256 i = 0; i < symbolsLength; i++) {
      signersForSymbols[i] = new address[](uniqueSignersTreshold);
      valuesForSymbols[i] = new uint256[](uniqueSignersTreshold);
    }

    // TODO: remove
    uniqueSignerCountForSymbols[0] = 1;
    valuesForSymbols[0][0] = 42;

    // Extracting data packages from calldata
    // TODO: Add more assembly
    for (uint256 dataPackageIndex = 0; dataPackageIndex < dataPackagesCount; dataPackageIndex++) {
      // Extracting data package details

      // 1. Extracting data points number for the current data package
      assembly {
        // We load the previous 32 bytes and automatically take the 2 least significant ones (casting to uint16)
        let dataPointsCountOffset := add(calldataOffset, add(SIG_BS, CALLDATA_SLOT_BS))
        dataPointsCount := calldataload(sub(calldatasize(), dataPointsCountOffset))
      }

      console.log("dataPointsCount:", dataPointsCount);

      // 2. Calculating the size of signed message expressed in bytes
      signedMessageBytesCount = uint256(dataPointsCount) * DP_SYMBOL_AND_VALUE_BS + TIMESTAMP_BS;

      // 3. Extracting the signed message, signature, and validating it
      // TODO: reuse allocated memory by allocating memory for the biggest datapackage message
      assembly {
        // let signedMessage := mload(FREE_MEMORY_PTR)
        signedMessage := mload(FREE_MEMORY_PTR) // TODO: remove
        mstore(signedMessage, signedMessageBytesCount)
        let signedMessageBytesStartPtr := add(signedMessage, CALLDATA_SLOT_BS)
        let signedMessageOffset := add(
          calldataOffset,
          add(signedMessageBytesCount, DP_NUMBER_AND_SIG_BS)
        )
        calldatacopy(
          signedMessageBytesStartPtr,
          sub(calldatasize(), signedMessageOffset),
          signedMessageBytesCount
        )
        mstore(FREE_MEMORY_PTR, add(signedMessageBytesStartPtr, signedMessageBytesCount))

        // Hashing the signed message
        // let signedHash := keccak256(signedMessageBytesStartPtr, signedMessageBytesCount)

        // // Extracting the off-chain signature from calldata
        // let signature := mload(FREE_MEMORY_PTR)
        // mstore(signature, SIG_BS)
        // let signatureBytesStartPtr := add(signature, BYTES_ARR_LEN_VAR_BS)
        // calldatacopy(signatureBytesStartPtr, sub(calldatasize(), SIG_BS), SIG_BS)
        // mstore(FREE_MEMORY_PTR, add(signatureBytesStartPtr, SIG_BS))

        // // Validating signature
        // signer := (bool success, bytes memory result) = contractAddress.staticcall(message)
        // signer := result
      }

      // console.log("signedHash");
      // console.logBytes32(signedHash);

      // 4. Hashing the signed message
      // bytes32 signedHash = keccak256(signedMessage);
      signedHash = keccak256(signedMessage);

      // 5. Extracting the off-chain signature from calldata
      // assembly {
      //   let signatureBytesStartPtr := add(signature, BYTES_ARR_LEN_VAR_BS)
      //   let signatureOffset := add(calldataOffset, SIG_BS)
      //   calldatacopy(signatureBytesStartPtr, sub(calldatasize(), signatureOffset), SIG_BS)
      // }

      // // 6. Verifying the off-chain signature against on-chain hashed data
      // address signer = _recoverSignerAddress(signedHash, signature);
      // require(isSignerAuthorized(signer), "Signer not authorized");

      // // 7. Extracting and validating timestamp of the data package
      // assembly {
      //   let timestampOffset := add(calldataOffset, TIMESTAMP_CALLDATA_OFFSET)
      //   let timestampStartIndex := sub(calldatasize(), timestampOffset)
      //   dataTimestamp := calldataload(timestampStartIndex)
      // }
      // require(isTimestampValid(dataTimestamp), "Data timestamp is invalid");

      // 8. Extracting values for the requested symbols
      // TODO: optimise gas by merging steps 8 and 9
      // uint256[] memory values;
      // values = _readValuesFromCallData(symbols, uint256(dataPointsCount), signedMessageBytesCount);

      // 9. Updating helpful arrays
      // TODO: implement using assembly
      // TODO: add breaking if collected sufficient number of unique values for each requested symbol
      for (uint256 dataPointIndex = 0; dataPointIndex < dataPointsCount; dataPointIndex++) {
        // bytes32 symbol = msg.data[start:end];
        bytes32 dpSymbol = bytes32("ETH"); // TODO: implement extracting from calldata
        uint256 dpValue = 42; // TODO: implement extracting from calldata

        for (uint256 symbolIndex = 0; symbolIndex < symbolsLength; symbolIndex++) {
          // bytes32 currentSymbol = symbols[symbolIndex];
          // if (symbols[symbolIndex] == dpSymbol) {
          //   bool currentSignerWasNotCountedForCurrentSymbol = true; // TODO: implement corrent calculation of currentSignerWasNotCountedForCurrentSymbol
          //   if (currentSignerWasNotCountedForCurrentSymbol) {
          //     uint256 valueIndexForSymbol = ++uniqueSignerCountForSymbols[symbolIndex];
          //     signersForSymbols[symbolIndex][valueIndexForSymbol] = signer;
          //     valuesForSymbols[symbolIndex][valueIndexForSymbol] = dpValue;
          //   }
          // }
        }
      }
    }

    // Checking the number of unique signers and calculating aggregated values
    return _getAggregatedValues(symbolsLength, valuesForSymbols, uniqueSignerCountForSymbols);
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

  // function getOracleValuesFromTxMsg(bytes32[] memory symbols)
  //   internal
  //   view
  //   returns (uint256[] memory)
  // {
  //   // The structure of calldata witn n - data items:
  //   // The data that is signed (symbols, values, timestamp) are inside the {} brackets
  //   // [origina_call_data| ?]{[[symbol | 32][value | 32] | n times][timestamp | 32]}[size | 1][signature | 65]

  //   // 1. Extracting dataPointsCount - the number of data points

  //   uint16 dataPointsCount; // Number of data points
  //   assembly {
  //     // Calldataload loads slots of 32 bytes
  //     // The last 65 bytes are for signature
  //     // We load the previous 32 bytes and automatically take the 2 least significant ones (casting to uint16)
  //     dataPointsCount := calldataload(sub(calldatasize(), add(SIG_BS, CALLDATA_SLOT_BS)))
  //   }

  //   // 2. Calculating the size of signed message expressed in bytes

  //   uint256 signedMessageBytesCount = uint256(dataPointsCount) *
  //     DP_SYMBOL_AND_VALUE_BS +
  //     TIMESTAMP_BS;

  //   // 3. We extract the signedMessage

  //   // High level equivalent below (1.2k gas more expensive)
  //   // uint256 startIndex = msg.data.length -
  //   //   signedMessageBytesCount -
  //   //   DP_NUMBERBER_BS -
  //   //   SIG_BS;
  //   // uint256 endIndex = msg.data.length -
  //   //   DP_NUMBERBER_BS -
  //   //   SIG_BS;
  //   // bytes memory signedMessage = msg.data[startIndex:endIndex];

  //   // Optimised assembly version
  //   bytes memory signedMessage;
  //   assembly {
  //     signedMessage := mload(FREE_MEMORY_PTR)
  //     mstore(signedMessage, signedMessageBytesCount)
  //     let signedMessageBytesStartPtr := add(signedMessage, CALLDATA_SLOT_BS)
  //     calldatacopy(
  //       signedMessageBytesStartPtr,
  //       sub(calldatasize(), add(signedMessageBytesCount, DP_NUMBER_AND_SIG_BS)),
  //       signedMessageBytesCount
  //     )

  //     // mstore(FREE_MEMORY_PTR, signedMessageBytesPtr) // <- old version (has memory leak)

  //     // New version (without memory leak)
  //     mstore(FREE_MEMORY_PTR, add(signedMessageBytesStartPtr, signedMessageBytesCount))
  //   }

  //   // 4. We first hash the raw message and then hash it again with the prefix

  //   // 4.V1 - with ethereum prefix (default signMessage in ethereum)
  //   // More info here: https://github.com/ethereum/eips/issues/191
  //   // bytes32 signedMessageHash = keccak256(signedMessage);
  //   // bytes32 signedHash = keccak256(
  //   //   abi.encodePacked("\x19Ethereum Signed Message:\n32", signedMessageHash)
  //   // );

  //   // 4.V2 - without ethereum prefix (0.5k gas cheaper)
  //   bytes32 signedHash = keccak256(signedMessage);

  //   // 5. We extract the off-chain signature from calldata

  //   // High level equivalent (0.5k gas more expensive)
  //   // uint256 signatureStartIndex = msg.data.length - SIG_BS;
  //   // uint256 signatureEndIndex = msg.data.length;
  //   // bytes memory signature = msg.data[signatureStartIndex:signatureEndIndex];

  //   // Optimised assembly version
  //   bytes memory signature;
  //   assembly {
  //     signature := mload(FREE_MEMORY_PTR)
  //     mstore(signature, SIG_BS)
  //     let signatureBytesStartPtr := add(signature, BYTES_ARR_LEN_VAR_BS)
  //     calldatacopy(signatureBytesStartPtr, sub(calldatasize(), SIG_BS), SIG_BS)
  //     mstore(FREE_MEMORY_PTR, add(signatureBytesStartPtr, SIG_BS))
  //   }

  //   // 6. We verify the off-chain signature against on-chain hashed data

  //   // Signature verification using openzeppelin library (0.5k gas more expensive)
  //   // address signer = hashWithPrefix.recover(signature);

  //   // Alternative option for signature verification (without using openzeppelin lbrary)
  //   address signer = _recoverSignerAddress(signedHash, signature);

  //   require(isSignerAuthorized(signer), "Signer not authorized");

  //   // 7. We extract timestamp from callData
  //   uint256 dataTimestamp;
  //   assembly {
  //     let timestampStartIndex := sub(calldatasize(), TIMESTAMP_CALLDATA_OFFSET)
  //     dataTimestamp := calldataload(timestampStartIndex)
  //   }

  //   // 8. We validate timestamp
  //   require(isTimestampValid(dataTimestamp), "Data timestamp is invalid");

  //   // 9. We extract values for the requested symbols and return them
  //   return _readFromCallData(symbols, uint256(dataPointsCount), signedMessageBytesCount);
  // }

  // It is not the most efficient implementation of duplicates checking
  // Because probably we won't use this function (in future)
  function assertUniqueSymbols(bytes32[] memory symbols) public pure {
    for (uint256 i = 0; i < symbols.length; i++) {
      for (uint256 j = 0; j < i; j++) {
        require(symbols[i] != symbols[j], "Found duplicates in symbols array");
      }
    }
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

  function _readValuesFromCallData(
    bytes32[] memory symbols,
    uint256 dataPointsCount,
    uint256 messageLength
  ) private pure returns (uint256[] memory) {
    uint256[] memory values;
    uint256 dataPointIndex;
    uint256 symbolIndex;
    uint256 readyAssetsCount;

    values = new uint256[](2);
    values[0] = 42;
    values[1] = 43;
    return values;

    // TODO: update this implementation (don't forget about calldataOffset)

    // Iterating through calldata to get variables for the requested symbols
    // assembly {
    //   let redstoneAppendixByteSize := add(messageLength, DP_NUMBER_AND_SIG_BS)
    //   let calldataStartIndex := sub(calldatasize(), redstoneAppendixByteSize) // start index in calldata for RedStone appendix

    //   // Allocating memory for the result array with values
    //   values := mload(FREE_MEMORY_PTR)
    //   let symbolsCount := mload(symbols)
    //   mstore(values, symbolsCount)
    //   let totalValuesArrayByteSize := add(BYTES_ARR_LEN_VAR_BS, mul(symbolsCount, DP_VALUE_BS))
    //   let updatedFreeMemoryPtr := add(values, totalValuesArrayByteSize)
    //   mstore(FREE_MEMORY_PTR, updatedFreeMemoryPtr)

    //   for {
    //     dataPointIndex := 0
    //   } lt(dataPointIndex, dataPointsCount) {
    //     dataPointIndex := add(dataPointIndex, 1) // dataPointIndex++
    //   } {
    //     let dataPointSymbol := calldataload(
    //       add(calldataStartIndex, mul(dataPointIndex, DP_SYMBOL_AND_VALUE_BS))
    //     )

    //     for {
    //       symbolIndex := 0
    //     } lt(symbolIndex, symbolsCount) {
    //       symbolIndex := add(symbolIndex, 1) // symbolIndex++
    //     } {
    //       let currentSymbolOffset := add(BYTES_ARR_LEN_VAR_BS, mul(symbolIndex, DP_SYMBOL_BS))
    //       let currentSymbolPtr := add(symbols, currentSymbolOffset)
    //       let currentSymbol := mload(currentSymbolPtr)

    //       if eq(currentSymbol, dataPointSymbol) {
    //         // Extract current value from calldata
    //         let currentValue := calldataload(
    //           add(
    //             add(calldataStartIndex, mul(dataPointIndex, DP_SYMBOL_AND_VALUE_BS)),
    //             DP_SYMBOL_BS
    //           )
    //         )

    //         // Save current value to the values array
    //         let currentValueOffset := add(BYTES_ARR_LEN_VAR_BS, mul(symbolIndex, DP_VALUE_BS))
    //         let currentValuePtr := add(values, currentValueOffset)
    //         mstore(currentValuePtr, currentValue)

    //         // Increment counter by 1
    //         readyAssetsCount := add(readyAssetsCount, 1)
    //       }

    //       // Breaking the loop after extracting enough symbols
    //       if eq(readyAssetsCount, symbolsCount) {
    //         dataPointIndex := dataPointsCount
    //       }
    //     }
    //   }
    // }

    // return values;
  }
}
