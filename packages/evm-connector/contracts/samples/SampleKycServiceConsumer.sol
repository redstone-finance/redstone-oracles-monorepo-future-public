// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../data-services/KycServiceConsumerBase.sol";

contract SampleKycServiceConsumer is KycServiceConsumerBase {
  bool passedKYC;

  function executeActionPassingKYC() public {
    bytes32 dataFeedId = keccak256(abi.encodePacked(msg.sender));
    uint256 isVerified = getOracleNumericValueFromTxMsg(dataFeedId);
    require(isVerified == 1, "User didn't pass KYC");
    passedKYC = true;
  }

  function getPassedKYCValue() public view returns (bool) {
    return passedKYC;
  }
}
