// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "./SampleRedstoneConsumerNumericMockManyDataFeeds.sol";

contract SampleRedstoneDataServiceConsumerMock is SampleRedstoneConsumerNumericMockManyDataFeeds {
  function getDataServiceId() public view virtual override returns (string memory) {
    return "mock-data-service-tests";
  }
}
