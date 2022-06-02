// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../commons/PriceVerifier.sol";

contract MockPriceVerifierProxy is PriceVerifier {
  function recoverDataSignerPublic(
    PriceData memory priceData,
    bytes memory signature
  ) public pure returns (address) {
    return recoverDataSigner(priceData, signature);
  }
}
