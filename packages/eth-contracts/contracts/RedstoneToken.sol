// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title RedstoneToken
 * @dev Standard implementation of ERC20 for Redstone token
 */
contract RedstoneToken is ERC20 {
  uint256 public constant MAX_SUPPLY = 50_000_000e18;

  error CanNotMintMoreThanMaxSupply();
  error OnlyMinterCanMint();
  error OnlyMinterCanProposeNewMinter();
  error OnlyProposedMinterCanAcceptMinterRole();

  event MinterProposal(address indexed proposedMinter);
  event MinterUpdate(address indexed newMinter);

  address public minter;
  address public proposedMinter;

  constructor(uint256 initialSupply) ERC20("Redstone", "RED") {
    enforceMaxSupplyLimit(initialSupply);
    _mint(msg.sender, initialSupply);
    minter = msg.sender;
  }

  function mint(address account, uint256 amount) external {
    if (msg.sender != minter) {
      revert OnlyMinterCanMint();
    }
    enforceMaxSupplyLimit(totalSupply() + amount);
    _mint(account, amount);
  }

  function proposeNewMinter(address newProposedMinter) external {
    if (msg.sender != minter) {
      revert OnlyMinterCanProposeNewMinter();
    }
    proposedMinter = newProposedMinter;
    emit MinterProposal(newProposedMinter);
  }

  function acceptMinterRole() external {
    if (msg.sender != proposedMinter) {
      revert OnlyProposedMinterCanAcceptMinterRole();
    }
    minter = proposedMinter;
    proposedMinter = address(0);
    emit MinterUpdate(minter);
  }

  function enforceMaxSupplyLimit(uint256 totalSupply) internal pure {
    if (totalSupply > MAX_SUPPLY) {
      revert CanNotMintMoreThanMaxSupply();
    }
  }
}
