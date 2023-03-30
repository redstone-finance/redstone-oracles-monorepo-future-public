// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

/**
 * @title Core logic of RedStone price updater contract
 * @author The Redstone Oracles team
 * @dev This contract is used to save RedStone data in blockchain
 * storage in a secure yet permissionless way. It allows anyone to
 * update prices in the contract storage in a round-based model
 */
contract PermissionlessPriceUpdater {
  // We don't use storage variables to avoid problems with upgradable contracts
  uint256 constant LAST_ROUND_STORAGE_LOCATION =
    0x919ecb282edbbb41bface801311ec7a6df61da05d3d63b938d35b526a69d4d6d; // keccak256("RedStone.lastRound");
  uint256 constant LAST_UPDATED_TIMESTAMP_STORAGE_LOCATION =
    0x3d01e4d77237ea0f771f1786da4d4ff757fcba6a92933aa53b1dcef2d6bd6fe2; // keccak256("RedStone.lastUpdateTimestamp");

  error ProposedTimestampMustBeNewerThanLastTimestamp(
    uint256 proposedTimestamp,
    uint256 lastUpdateTimestampMilliseconds
  );

  error DataPackageTimestampIsOlderThanProposedTimestamp(
    uint256 proposedTimestamp,
    uint256 receivedTimestampMilliseconds
  );

  function validateAndUpdateProposedRoundAndTimestamp(
    uint256 proposedRound,
    uint256 proposedTimestamp
  ) internal {
    validateProposedRound(proposedRound);
    validateProposedTimestamp(proposedTimestamp);
    setLastRound(proposedRound);
    setLastUpdateTimestamp(proposedTimestamp);
  }

  function validateDataPackageTimestampAgainstProposedTimestamp(
    uint256 receivedTimestampMilliseconds
  ) public view {
    /* 
      Here lastUpdateTimestampMilliseconds is already updated by the
      validateAndUpdateProposedRoundAndTimestamp function and equals
      to the proposed timestamp
    */
    uint256 lastUpdateTimestampMilliseconds = getLastUpdateTimestamp();
    if (receivedTimestampMilliseconds < lastUpdateTimestampMilliseconds) {
      revert DataPackageTimestampIsOlderThanProposedTimestamp(
        lastUpdateTimestampMilliseconds,
        receivedTimestampMilliseconds
      );
    }
  }

  /*
    If the proposed round isn't valid it will stops the contract execution.
    We intentionally do not revert the execution to prevent misleading rare
    failed transactions in blockchain explorers that can be caused by race
    conditions between independent relayers
  */
  function validateProposedRound(uint256 proposedRound) internal view {
    if (!isProposedRoundValid(proposedRound)) {
      assembly {
        return(0, 0x20)
      }
    }
  }

  function validateProposedTimestamp(uint256 proposedTimestamp) internal view {
    if (proposedTimestamp <= getLastUpdateTimestamp()) {
      revert ProposedTimestampMustBeNewerThanLastTimestamp(
        proposedTimestamp,
        getLastUpdateTimestamp()
      );
    }
  }

  function isProposedRoundValid(uint256 proposedRound) private view returns (bool) {
    return proposedRound == getLastRound() + 1;
  }

  function getLastRound() public view returns (uint256 lastRound) {
    assembly {
      lastRound := sload(LAST_ROUND_STORAGE_LOCATION)
    }
  }

  function getLastUpdateTimestamp() public view returns (uint256 lastUpdateTimestamp) {
    assembly {
      lastUpdateTimestamp := sload(LAST_UPDATED_TIMESTAMP_STORAGE_LOCATION)
    }
  }

  function setLastRound(uint256 lastRound) internal {
    assembly {
      sstore(LAST_ROUND_STORAGE_LOCATION, lastRound)
    }
  }

  function setLastUpdateTimestamp(uint256 lastUpdateTimestampMilliseconds) internal {
    assembly {
      sstore(LAST_UPDATED_TIMESTAMP_STORAGE_LOCATION, lastUpdateTimestampMilliseconds)
    }
  }

  function getLastRoundParams()
    public
    view
    returns (uint256 lastRound, uint256 lastUpdateTimestamp)
  {
    lastRound = getLastRound();
    lastUpdateTimestamp = getLastUpdateTimestamp();
  }
}
