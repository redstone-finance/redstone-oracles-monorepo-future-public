// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../commons/ProxyConnector.sol";
import "./SamplePriceAware.sol";

/**
 * @title ProxyConnector
 * @dev An example of a contract that makes a call to a PriceAware type contract
 */
contract SampleProxyConnector {

  SamplePriceAware samplePriceAware;

  function initializePriceAware() external {
    samplePriceAware = new SamplePriceAware();
    samplePriceAware.authorizeSigner(0xFE71e9691B9524BC932C23d0EeD5c9CE41161884);
  }

  function checkPrice(bytes32 asset, uint256 price) external {
    bytes memory encodedFunction = abi.encodeWithSelector(SamplePriceAware.getPrice.selector, asset);

    bytes memory encodedResult = ProxyConnector.proxyCalldata(address(samplePriceAware), encodedFunction, false);

    uint256 oraclePrice = abi.decode(encodedResult, (uint256));

    require(oraclePrice == price, 'Wrong price!');
  }

  function getPriceShortEncodedFunction (bytes32 asset, uint256 price) external {
    asset; // It's added to avoid warning about unused function argument

    bytes memory encodedFunction = abi.encodeWithSelector(
      SamplePriceAware.a.selector
    );

    bytes memory encodedResult = ProxyConnector.proxyCalldata(address(samplePriceAware), encodedFunction, false);

    uint256 oraclePrice = abi.decode(encodedResult, (uint256));

    require(oraclePrice == price, 'Wrong price!');
  }

  function requireValueForward() external payable {
    bytes memory encodedFunction = abi.encodeWithSelector(
      SamplePriceAware.returnMsgValue.selector
    );
    bytes memory encodedResult = ProxyConnector.proxyCalldata(address(samplePriceAware), encodedFunction, false);
    uint256 msgValue = abi.decode(encodedResult, (uint256));

    require(msgValue == 0, 'Expected msg.value not to be passed');

    encodedResult = ProxyConnector.proxyCalldata(address(samplePriceAware), encodedFunction, true);
    msgValue = abi.decode(encodedResult, (uint256));

    require(msgValue == msg.value, 'Expected msg.value to be passed');
  }

  function getPriceLongEncodedFunction(bytes32 asset, uint256 price) external {
    bytes memory encodedFunction = abi.encodeWithSelector(
      SamplePriceAware.getPriceManyParameters.selector,
      asset,
      115792089237316195423570985008687907853269984665640564039457584007913129639935,
      'long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      );

    bytes memory encodedResult = ProxyConnector.proxyCalldata(address(samplePriceAware), encodedFunction, false);

    uint256 oraclePrice = abi.decode(encodedResult, (uint256));

    require(oraclePrice == price, 'Wrong price!');
  }
}
