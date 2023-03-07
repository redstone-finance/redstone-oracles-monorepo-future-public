// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PriceFeed.sol";

contract PriceFeedsRegistry is Ownable {
  using EnumerableMap for EnumerableMap.UintToAddressMap;
  using EnumerableSet for EnumerableSet.Bytes32Set;

  EnumerableMap.UintToAddressMap private priceFeedsContracts;
  address private priceFeedsManagerAddress;

  constructor(address priceFeedsManagerAddress_) {
    priceFeedsManagerAddress = priceFeedsManagerAddress_;
  }

  function getPriceFeedContractAddress(bytes32 dataFeedId) public view returns (address) {
    return EnumerableMap.get(priceFeedsContracts, uint256(dataFeedId));
  }

  function getDataFeeds() public view returns (bytes32[] memory) {
    return keys(priceFeedsContracts._inner);
  }

  function addDataFeed(bytes32 dataFeedId) public onlyOwner {
    EnumerableMap.set(priceFeedsContracts, uint256(dataFeedId), deployPriceFeed(dataFeedId));
  }

  function removeDataFeed(bytes32 dataFeedId) public onlyOwner {
    EnumerableMap.remove(priceFeedsContracts, uint256(dataFeedId));
  }

  function deployPriceFeed(bytes32 dataFeedId) private returns (address) {
    return
      address(
        new PriceFeed(
          priceFeedsManagerAddress,
          dataFeedId,
          string(
            abi.encodePacked("RedStone price feed for ", string(abi.encodePacked(dataFeedId)))
          )
        )
      );
  }

  /**
   * TAKEN FROM https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/EnumerableMap.sol#L167
   * MERGED TO MAIN BUT NOT PUBLISHED
   *
   * @dev Return the an array containing all the keys
   *
   * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
   * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
   * this function has an unbounded cost, and using it as part of a state-changing function may render the function
   * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
   */
  function keys(EnumerableMap.Bytes32ToBytes32Map storage map)
    internal
    view
    returns (bytes32[] memory)
  {
    return map._keys.values();
  }
}
