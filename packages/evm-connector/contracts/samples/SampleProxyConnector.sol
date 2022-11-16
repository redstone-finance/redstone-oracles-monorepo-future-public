// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../core/ProxyConnector.sol";
import "./SampleRedstoneConsumerNumericMock.sol";

/**
 * @title SampleProxyConnector
 * @dev An example of a contract that makes a call to a SampleRedstoneConsumerMock contract
 */
contract SampleProxyConnector is ProxyConnector {
  error UnexpectedOracleValue();
  error WrongValue();
  error ExpectedMsgValueToBePassed();
  error ExpectedMsgValueNotToBePassed();

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

  function proxyEmptyError() public view {
    bytes memory encodedFunction = abi.encodeWithSelector(
      SampleRedstoneConsumerNumericMock.revertWithoutMessage.selector
    );
    proxyCalldataView(address(sampleRedstoneConsumer), encodedFunction);
  }

  function proxyTestStringError() public view {
    bytes memory encodedFunction = abi.encodeWithSelector(
      SampleRedstoneConsumerNumericMock.revertWithTestMessage.selector
    );
    proxyCalldataView(address(sampleRedstoneConsumer), encodedFunction);
  }

  function checkOracleValue(bytes32 dataFeedId, uint256 expectedValue) external view {
    uint256 oracleValue = getOracleValueUsingProxy(dataFeedId);
    if (oracleValue != expectedValue) {
      revert UnexpectedOracleValue();
    }
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

    if (oraclePrice != price) {
      revert WrongValue();
    }
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

    if (msgValue != 0) {
      revert ExpectedMsgValueNotToBePassed();
    }

    encodedResult = ProxyConnector.proxyCalldata(
      address(sampleRedstoneConsumer),
      encodedFunction,
      true
    );
    msgValue = abi.decode(encodedResult, (uint256));

    if (msgValue != msg.value) {
      revert ExpectedMsgValueToBePassed();
    }
  }
}
