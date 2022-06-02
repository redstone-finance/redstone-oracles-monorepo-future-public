// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
pragma experimental ABIEncoderV2;

import "./IPriceFeed.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PriceVerifier.sol";

/**
 * @title PriceFeed
 * @dev A contract that provides prices for assets
 * It's integrated with the PriceVerifier contract that checks data authenticity
 */
contract PriceFeed is IPriceFeed, PriceVerifier, Ownable {
  uint256 public maxPriceDelayMilliseconds = 5 * 60 * 1000;

  // A map indicating if a signer could be trusted by a client protocol
  mapping(address => bool) trustedSigners;

  mapping(bytes32 => uint256) internal prices;

  function setPrices(PriceData calldata _priceData, bytes calldata _signature)
    external
  {
    PriceData memory priceData = _priceData;
    bytes memory signature = _signature;
    _checkPrices(priceData, signature);
    _setPrices(_priceData);
  }

  function _checkPrices(PriceData memory priceData, bytes memory signature)
    public
    view
  {
    address signer = recoverDataSigner(priceData, signature);
    uint256 blockTimestampMillseconds = block.timestamp * 1000;

    require(isSigner(signer), "Unauthorized price data signer");
    require(
      blockTimestampMillseconds - priceData.timestamp <
        maxPriceDelayMilliseconds,
      "Price data timestamp too old"
    );
  }

  function _setPrices(PriceData calldata priceData) internal virtual {
    // TODO: later we can implement rules for update skipping
    // e.g. if price has chhanged insignifficantly
    // or if current time is too close to the last updated time
    for (uint256 i = 0; i < priceData.symbols.length; i++) {
      prices[priceData.symbols[i]] = priceData.values[i];
    }
  }

  function setMaxPriceDelay(uint256 _maxPriceDelayMilliseconds)
    external
    onlyOwner
  {
    require(
      _maxPriceDelayMilliseconds > 0,
      "Maximum price delay must be greater than 0"
    );
    maxPriceDelayMilliseconds = _maxPriceDelayMilliseconds;
  }

  function getPrice(bytes32 symbol) public view override returns (uint256) {
    require(prices[symbol] > 0, "No pricing data for given symbol");
    return prices[symbol];
  }

  function authorizeSigner(address signer) external onlyOwner {
    trustedSigners[signer] = true;
  }

  function revokeSigner(address signer) external onlyOwner {
    delete trustedSigners[signer];
  }

  function isSigner(address potentialSigner) public view returns (bool) {
    return trustedSigners[potentialSigner];
  }
}
