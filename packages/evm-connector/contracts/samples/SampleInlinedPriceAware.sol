// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../mocks/MockStatePriceProvider.sol";
import "../message-based/PriceAware.sol";

/**
 * @title SampleInlinedPriceAware
 * @dev An example of a contract using message-based way of fetching data from RedStone
 * It has only a few dummy methods used to benchmark gas consumption
 * It extends InlinedPriceAware which in-lines signer address and maximum delay of price feed
 * to reduce the gas of every invocation (saving is ~4k gas)
 */
contract SampleInlinedPriceAware is PriceAware {

  address private constant TRUSTED_SIGNER = 0xFE71e9691B9524BC932C23d0EeD5c9CE41161884;

  function isSignerAuthorized(address _receviedSigner) public override virtual view returns (bool) {
    return _receviedSigner == TRUSTED_SIGNER;
  }

  function getPrice(bytes32 asset) external view returns (uint256) {
    return getPriceFromMsg(asset);
  }

  function executeWithPrice(bytes32 asset) public view returns (uint256) {
    return getPriceFromMsg(asset);
  }

  function executeWithPrices(bytes32[] memory assets)
    public
    view
    returns (uint256[] memory)
  {
    return getPricesFromMsg(assets);
  }
}
