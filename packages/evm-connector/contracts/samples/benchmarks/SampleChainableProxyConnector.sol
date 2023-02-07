// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../../core/ProxyConnector.sol";
import "./SampleProxyConnectorConsumer.sol";

contract SampleChainableProxyConnector is ProxyConnector {
  SampleProxyConnectorConsumer sampleRedstoneConsumer;
  SampleChainableProxyConnector nextConnector;

  function registerConsumer(address _sampleProxyConnectorConsumer) external {
    sampleRedstoneConsumer = SampleProxyConnectorConsumer(_sampleProxyConnectorConsumer);
  }

  function registerNextConnector(address _sampleProxyConnector) external {
    nextConnector = SampleChainableProxyConnector(_sampleProxyConnector);
  }

  function processOracleValue(bytes32 dataFeedId) external {
    if (address(nextConnector) != address(0)) {
      bytes memory encodedFunction = abi.encodeWithSelector(
        this.processOracleValue.selector,
        dataFeedId
      );
      proxyCalldata(address(nextConnector), encodedFunction, false);
    } else {
      bytes memory encodedFunction = abi.encodeWithSelector(
        sampleRedstoneConsumer.processOracleValue.selector,
        dataFeedId
      );
      proxyCalldata(address(sampleRedstoneConsumer), encodedFunction, false);
    }
  }

  function processOracleValues(bytes32[] memory dataFeedIds) external {
    if (address(nextConnector) != address(0)) {
      bytes memory encodedFunction = abi.encodeWithSelector(
        this.processOracleValues.selector,
        dataFeedIds
      );
      proxyCalldata(address(nextConnector), encodedFunction, false);
    } else {
      bytes memory encodedFunction = abi.encodeWithSelector(
        sampleRedstoneConsumer.processOracleValues.selector,
        dataFeedIds
      );
      proxyCalldata(address(sampleRedstoneConsumer), encodedFunction, false);
    }
  }
}
