// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./PriceModel.sol";

contract PriceVerifier is PriceModel {
  using ECDSA for bytes32;

  bytes32 constant DOMAIN_SEPARATOR =
    keccak256(
      abi.encode(
        EIP712_DOMAIN_TYPEHASH,
        keccak256("Redstone"),
        keccak256("0.4"),
        1 //chainId - to be removed
      )
    );

  function recoverDataSigner(PriceData memory priceData, bytes memory signature)
    internal
    pure
    returns (address)
  {
    bytes32 hash = hashPriceData(priceData);
    return hash.recover(signature);
  }

  // We follow the EIP-712 standard for structured data hashing and signing
  // Learn more: https://eips.ethereum.org/EIPS/eip-712
  function hashPriceData(PriceData memory priceData)
    internal
    pure
    returns (bytes32)
  {
    return
      keccak256(
        abi.encodePacked(
          "\x19\x01",
          DOMAIN_SEPARATOR,
          keccak256(
            abi.encode(
              PRICE_DATA__TYPEHASH,
              keccak256(abi.encodePacked(priceData.symbols)),
              keccak256(abi.encodePacked(priceData.values)),
              priceData.timestamp
            )
          )
        )
      );
  }
}
