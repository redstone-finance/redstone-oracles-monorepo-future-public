// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../mocks/MockStatePriceProvider.sol";
import "../message-based/PriceAware.sol";

/**
 * @title SamplePriceAwareWithManySigners
 * @dev An example of a contract using a message-based way of fetching data from RedStone
 * It has only a few methods used to benchmark gas consumption
 * It extends PriceAware and allows changing trusted signers and message delay
 */
contract SamplePriceAwareWithManySigners is PriceAware {

  address constant public AUTHORIZED_SIGNER_1 = 0x3a7d971De367FE15D164CDD952F64205F2D9f10c;
  address constant public AUTHORIZED_SIGNER_2 = 0x41ed5321B76C045f5439eCf9e73F96c6c25B1D75;

  function getPrice(bytes32 asset) external view returns (uint256) {
    return getPriceFromMsg(asset);
  }

  function executeWithPrice(bytes32 asset) public view returns (uint256) {
    return getPriceFromMsg(asset);
  }

  function executeWithPrices(bytes32[] memory assets) public view returns (uint256[] memory)
  {
    return getPricesFromMsg(assets);
  }

  function isSignerAuthorized(address _receviedSigner) public override pure returns (bool) {
    return (_receviedSigner == AUTHORIZED_SIGNER_1) || (_receviedSigner == AUTHORIZED_SIGNER_2);
  }

  function a() external view returns (uint256) {
    return getPriceFromMsg(bytes32("ETH"));
  }
}
