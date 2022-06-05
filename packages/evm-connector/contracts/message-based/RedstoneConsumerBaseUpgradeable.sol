// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./RedstoneConsumerBase.sol";

contract RedstoneConsumerBaseUpgradeable is RedstoneConsumerBase, OwnableUpgradeable {
  address private trustedSigner;

  function __RedstoneConsumerBase_init() internal initializer {}

  function authorizeSigner(address _trustedSigner) external onlyOwner {
    require(_trustedSigner != address(0));
    trustedSigner = _trustedSigner;

    emit TrustedSignerChanged(trustedSigner);
  }

  function isSignerAuthorized(address _receviedSigner) public view virtual override returns (bool) {
    return _receviedSigner == trustedSigner;
  }

  /* ========== EVENTS ========== */

  /**
   * @dev emitted after the owner updates trusted signer
   * @param newSigner the address of the new signer
   **/
  event TrustedSignerChanged(address indexed newSigner);
}
