// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Mapping between Redstone's data feed ids and token addresses
 * @author The Redstone Oracles team
 * @dev This contract contains the logic of managing the mapping by the
 * contract owner. It is used as a base contract in the mento adapter
 * implementation
 */
contract MentoDataFeedsManager is Ownable {
  using EnumerableMap for EnumerableMap.UintToAddressMap;

  struct DataFeedDetails {
    bytes32 dataFeedId;
    address tokenAddress;
  }

  EnumerableMap.UintToAddressMap private dataFeedIdToTokenAddressMap;

  // Adds or updates token address for a given data feed id
  function setDataFeed(bytes32 dataFeedId, address tokenAddress) external onlyOwner {
    dataFeedIdToTokenAddressMap.set(uint256(dataFeedId), tokenAddress);
  }

  function removeDataFeed(bytes32 dataFeedId) external onlyOwner {
    dataFeedIdToTokenAddressMap.remove(uint256(dataFeedId));
  }

  function getDataFeedsCount() public view returns (uint256) {
    return dataFeedIdToTokenAddressMap.length();
  }

  function getTokenAddressByDataFeedId(bytes32 dataFeedId) public view returns (address) {
    return dataFeedIdToTokenAddressMap.get(uint256(dataFeedId));
  }

  function getDataFeedIds() public view returns (bytes32[] memory) {
    uint256 dataFeedsCount = getDataFeedsCount();
    bytes32[] memory dataFeedIds = new bytes32[](dataFeedsCount);
    for (uint256 dataFeedIndex = 0; dataFeedIndex < dataFeedsCount; dataFeedIndex++) {
      (dataFeedIds[dataFeedIndex], ) = getTokenDetailsAtIndex(dataFeedIndex);
    }

    return dataFeedIds;
  }

  function getDataFeeds() public view returns (DataFeedDetails[] memory) {
    uint256 dataFeedsCount = getDataFeedsCount();
    DataFeedDetails[] memory dataFeeds = new DataFeedDetails[](dataFeedsCount);
    for (uint256 dataFeedIndex = 0; dataFeedIndex < dataFeedsCount; dataFeedIndex++) {
      (bytes32 dataFeedId, address tokenAddress) = getTokenDetailsAtIndex(dataFeedIndex);
      dataFeeds[dataFeedIndex] = DataFeedDetails({
        dataFeedId: dataFeedId,
        tokenAddress: tokenAddress
      });
    }
    return dataFeeds;
  }

  function getTokenDetailsAtIndex(
    uint256 tokenIndex
  ) public view returns (bytes32 dataFeedId, address tokenAddress) {
    (uint256 dataFeedIdNumber, address tokenAddress_) = dataFeedIdToTokenAddressMap.at(tokenIndex);
    dataFeedId = bytes32(dataFeedIdNumber);
    tokenAddress = tokenAddress_;
  }
}
