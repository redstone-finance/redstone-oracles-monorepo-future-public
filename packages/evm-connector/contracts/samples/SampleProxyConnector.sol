// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../core/ProxyConnector.sol";
import "./SampleRedstoneConsumerMock.sol";

/**
 * @title SampleProxyConnector
 * @dev An example of a contract that makes a call to a SampleRedstoneConsumerMock contract
 */
contract SampleProxyConnector is ProxyConnector {
  SampleRedstoneConsumerMock sampleRedstoneConsumer;

  constructor() {
    sampleRedstoneConsumer = new SampleRedstoneConsumerMock();
  }

  function getOracleValueUsingProxy(bytes32 dataFeedId) external view returns (uint256) {
    bytes memory encodedFunction = abi.encodeWithSelector(
      SampleRedstoneConsumerMock.getValueForDataFeedId.selector,
      dataFeedId
    );

    bytes memory encodedResult = proxyCalldataView(
      address(sampleRedstoneConsumer),
      encodedFunction
    );

    return abi.decode(encodedResult, (uint256));
  }
}
