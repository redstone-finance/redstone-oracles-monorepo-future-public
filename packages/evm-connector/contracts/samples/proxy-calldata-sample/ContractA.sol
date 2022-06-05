// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./ContractB.sol";
import "../../commons/ProxyConnector.sol";

contract ContractA {
  ContractB private contractB;

  uint256 private lastValueFromContractB;

  constructor() {
    contractB = new ContractB();
  }

  function writeInContractB() public {
    // Usually we would simply call the one instruction below
    // bContract.setPrice();

    // But to proxy calldata we need to add a bit more instructions
    ProxyConnector.proxyCalldata(
      address(contractB),
      abi.encodeWithSelector(ContractB.writeValue.selector),
      false
    );
  }

  // Implementation from: https://stackoverflow.com/a/63258666
  function toUint256(bytes memory _bytes) internal pure returns (uint256 value) {
    assembly {
      value := mload(add(_bytes, 0x20))
    }
  }

  function readFromContractBAndSave() public {
    // Usually we would simply call the one instruction below
    // lastValueFromContractB = bContract.getLastTeslaPrice();

    // But to proxy calldata we need to add a bit more instructions
    bytes memory bytesResponse = ProxyConnector.proxyCalldata(
      address(contractB),
      abi.encodeWithSelector(ContractB.getValue.selector),
      false
    );
    lastValueFromContractB = toUint256(bytesResponse);
  }

  function getLastValueFromContractB() public view returns (uint256) {
    return lastValueFromContractB;
  }
}
