// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../core/ProxyConnector.sol";
import "./SampleRedstoneConsumerNumericMock.sol";

/**
 * @title SampleProxyConnector
 * @dev An example of a contract that makes a call to a SampleRedstoneConsumerMock contract
 */
contract SampleProxyConnector is ProxyConnector {
  SampleRedstoneConsumerNumericMock sampleRedstoneConsumer;

  constructor() {
    sampleRedstoneConsumer = new SampleRedstoneConsumerNumericMock();
  }

  function getOracleValueUsingProxy(bytes32 dataFeedId) public view returns (uint256) {
    bytes memory encodedFunction = abi.encodeWithSelector(
      SampleRedstoneConsumerNumericMock.getValueForDataFeedId.selector,
      dataFeedId
    );

    bytes memory encodedResult = proxyCalldataView(
      address(sampleRedstoneConsumer),
      encodedFunction
    );

    return abi.decode(encodedResult, (uint256));
  }

  function checkOracleValue(bytes32 dataFeedId, uint256 expectedValue) external view {
    uint256 oracleValue = getOracleValueUsingProxy(dataFeedId);
    require(oracleValue == expectedValue, "Received an unexpected oracle value");
  }

  function checkOracleValueLongEncodedFunction(bytes32 asset, uint256 price) external {
    bytes memory encodedFunction = abi.encodeWithSelector(
      SampleRedstoneConsumerNumericMock.getValueManyParams.selector,
      asset,
      115792089237316195423570985008687907853269984665640564039457584007913129639935,
      "long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );

    bytes memory encodedResult = ProxyConnector.proxyCalldata(
      address(sampleRedstoneConsumer),
      encodedFunction,
      false
    );

    uint256 oraclePrice = abi.decode(encodedResult, (uint256));

    require(oraclePrice == price, "Wrong value!");
  }

  function requireValueForward() external payable {
    bytes memory encodedFunction = abi.encodeWithSelector(
      SampleRedstoneConsumerNumericMock.returnMsgValue.selector
    );
    bytes memory encodedResult = ProxyConnector.proxyCalldata(
      address(sampleRedstoneConsumer),
      encodedFunction,
      false
    );
    uint256 msgValue = abi.decode(encodedResult, (uint256));

    require(msgValue == 0, "Expected msg.value not to be passed");

    encodedResult = ProxyConnector.proxyCalldata(
      address(sampleRedstoneConsumer),
      encodedFunction,
      true
    );
    msgValue = abi.decode(encodedResult, (uint256));

    require(msgValue == msg.value, "Expected msg.value to be passed");
  }
}
