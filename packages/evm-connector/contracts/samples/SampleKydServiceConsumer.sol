// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../data-services/KydServiceConsumerBase.sol";

contract SampleKydServiceConsumer is KydServiceConsumerBase {
  error UserDidNotPassKYD(address user);

  bool passedKYD;

  function executeActionPassingKYD() public {
    bytes32 dataFeedId = keccak256(abi.encodePacked(msg.sender));
    uint256 isVerified = getOracleNumericValueFromTxMsg(dataFeedId);
    if (isVerified != 1) {
      revert UserDidNotPassKYD(msg.sender);
    }
    passedKYD = true;
  }

  function getPassedKYDValue() public view returns (bool) {
    return passedKYD;
  }
}
