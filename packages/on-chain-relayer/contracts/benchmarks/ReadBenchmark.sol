// SPDX-License-Identifier: MIT
import {PriceFeedsAdapterWithLowestGasRead} from "../mocks/PriceFeedsAdapterWithLowestRead.sol";

pragma solidity ^0.8.14;

contract ReadBenchmark {
  event Value(uint256);

  uint256 counter = 100;
  PriceFeedsAdapterWithLowestGasRead readFrom;
  address rawAddress;

  bytes constant getBtcValueWithLowestGasSig =
    abi.encodeWithSignature("getBtcValueWithLowestGas()");
  address immutable IMMUTABLE_ADDRESS =
    0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9;
  bytes4 constant SIG = 0xc505f591;

  constructor(address _readFrom) {
    readFrom = PriceFeedsAdapterWithLowestGasRead(_readFrom);
    rawAddress = _readFrom;
    assembly {
      sstore(
        0xf497211eccb68cc78a757a9caed87152a70e6da38b5f59e20a3feb628cda40b8,
        0x64
      )
    }
  }

  function getBtcValueWithLowestGas() external view returns (uint256) {
    return readFrom.getBtcValueWithLowestGas();
  }

  function stdReadUnsafe() external view returns (uint256) {
    return readFrom.getValueForDataFeedUnsafe(bytes32("BTC"));
  }

  function readFromStateWithoutCall() external view returns (uint256) {
    return counter;
  }

  function readFromStateWithoutCallAssembly()
    external
    view
    returns (uint256 dataFeedValue)
  {
    assembly {
      dataFeedValue := sload(
        0xf497211eccb68cc78a757a9caed87152a70e6da38b5f59e20a3feb628cda40b8
      )
    }
  }

  function readUsingStaticCall() external view returns (uint256) {
    (, bytes memory data) = rawAddress.staticcall(getBtcValueWithLowestGasSig);
    return uint8(data[0]);
  }

  function readUsingStaticCallAssembly() external view returns (uint256) {
    uint256 value;

    assembly {
      let freeSlot := mload(0x40)

      mstore(freeSlot, SIG)

      let success := staticcall(
        5000, // estimated gas cost for this function
        0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9,
        freeSlot,
        0x04,
        freeSlot,
        0x20
      )
      // we don't have to handle error, cause underlying function never fails

      value := mload(freeSlot)
    }

    return value;
  }

  function readUsingStaticCallAssemblyWithErrorHandling()
    external
    view
    returns (uint256)
  {
    uint256 value;

    assembly {
      let freeSlot := mload(0x40)

      mstore(freeSlot, SIG)

      let success := staticcall(
        5000, // estimated gas cost for this function
        0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9,
        freeSlot,
        0x04,
        freeSlot,
        0x20
      )

      switch success
      case 0 {
        revert(freeSlot, 0x40)
      }
      default {
        value := mload(freeSlot)
      }
    }

    return value;
  }

  function readUsingStaticCallAssemblyWithErrorHandlingWithImmutable()
    external
    view
    returns (uint256)
  {
    uint256 value;
    address tempAddress = IMMUTABLE_ADDRESS;
    assembly {
      let freeSlot := mload(0x40)

      mstore(freeSlot, SIG)

      let success := staticcall(
        5000, // estimated gas cost for this function
        tempAddress,
        freeSlot,
        0x04,
        freeSlot,
        0x20
      )

      switch success
      case 0 {
        revert(freeSlot, 0x40)
      }
      default {
        value := mload(freeSlot)
      }
    }

    return value;
  }

  function readUsingCallAssemblyWithErrorHandling() external returns (uint256) {
    uint256 value;

    assembly {
      let freeSlot := mload(0x40)

      mstore(freeSlot, SIG)

      let success := call(
        5000, // estimated gas cost for this function
        0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9,
        0, // value to send
        freeSlot,
        0x04,
        freeSlot,
        0x20
      )
      // we don't have to handle error, cause underlying function never fails

      switch success
      case 0 {
        revert(freeSlot, 0x40)
      }
      default {
        value := mload(freeSlot)
      }
    }

    return value;
  }

  function readUsingDelegateCallAssemblyWithErrorHandling()
    external
    returns (uint256)
  {
    uint256 value;

    assembly {
      let freeSlot := mload(0x40)

      mstore(freeSlot, SIG)

      let success := delegatecall(
        5000, // estimated gas cost for this function
        0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9,
        freeSlot,
        0x04,
        freeSlot,
        0x20
      )

      switch success
      case 0 {
        revert(freeSlot, 0x40)
      }
      default {
        value := mload(freeSlot)
      }
    }

    return value;
  }

  function readUsingCall() external returns (uint256) {
    (, bytes memory data) = rawAddress.call(getBtcValueWithLowestGasSig);
    return uint8(data[0]);
  }
}

contract Hopper {
  Hopper hopTo;
  bool lastHooper;

  constructor(address _hopTo, bool _lastHooper) {
    hopTo = Hopper(_hopTo);
    lastHooper = _lastHooper;
  }

  function nextHop() external {
    if (lastHooper == false) {
      Hopper(hopTo).nextHop();
    }
  }
}
