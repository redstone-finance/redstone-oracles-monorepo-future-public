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

  function getOracleValueUsingProxy(bytes32 dataFeedId) external view returns (uint256) {
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
}
