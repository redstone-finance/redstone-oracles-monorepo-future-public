// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../data-services/KycServiceConsumerBase.sol";

contract SampleKycServiceConsumer is KycServiceConsumerBase {
  error UserDidNotPassKYC(address user);

  bool passedKYC;

  function executeActionPassingKYC() public {
    bytes32 dataFeedId = keccak256(abi.encodePacked(msg.sender));
    uint256 isVerified = getOracleNumericValueFromTxMsg(dataFeedId);
    if (isVerified != 1) {
      revert UserDidNotPassKYC(msg.sender);
    }
    passedKYC = true;
  }

  function getPassedKYCValue() public view returns (bool) {
    return passedKYC;
  }
}
