// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {SinglePriceFeedAdapter} from "../without-rounds/SinglePriceFeedAdapter.sol";

contract VSTPriceFeedsAdapter is SinglePriceFeedAdapter {
  uint256 internal constant BIT_MASK_TO_CHECK_CIRCUIT_BREAKER_FLAG = 0x0000000000000000000000000100000000000000000000000000000000000000;

  error InvalidSignersCount(uint256 signersCount);
  error CircuitBreakerTripped();

  function getDataFeedId() public pure override returns (bytes32) {
    return bytes32("VST");
  }

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 2; // 2 out of 3
  }

  function aggregateValues(uint256[] memory values) public pure override returns (uint256) {
    if (values.length != 2) {
      revert InvalidSignersCount(values.length);
    }

    _checkCircuitBreaker(values[0]);
    _checkCircuitBreaker(values[1]);

    return (values[0] + values[1]) / 2;
  }

  function _checkCircuitBreaker(uint256 value) internal pure {
    if (value & BIT_MASK_TO_CHECK_CIRCUIT_BREAKER_FLAG > 0) {
      revert CircuitBreakerTripped();
    }
  }

  function getAuthorisedSignerIndex(
    address signerAddress
  ) public view virtual override returns (uint8) {
    if (signerAddress == 0xf7a873ff07E1d021ae808a28e6862f821148c789) {
      return 0;
    } else if (signerAddress == 0x827Cc644d3f33d55075354875A961aC8B9EB7Cc8) {
      return 1;
    } else if (signerAddress == 0x1C31b3eA83F48A6E550938d295893514A9e99Eca) {
      return 2;
    } else {
      revert SignerNotAuthorised(signerAddress);
    }
  }
}
