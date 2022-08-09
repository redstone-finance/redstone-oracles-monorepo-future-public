// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerNumericMock.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 * For a generic mechanism see {ERC20PresetMinterPauser}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * We have followed general OpenZeppelin guidelines: functions revert instead
 * of returning `false` on failure. This behavior is nonetheless conventional
 * and does not conflict with the expectations of ERC20 applications.
 *
 * Additionally, an {Approval} event is emitted on calls to {transferFrom}.
 * This allows applications to reconstruct the allowance for all accounts just
 * by listening to said events. Other implementations of the EIP may not emit
 * these events, as it isn't required by the specification.
 *
 * Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
 * functions have been added to mitigate the well-known issues around setting
 * allowances. See {IERC20-approve}.
 */
contract ERC20Initializable is Context, IERC20, IERC20Metadata {
  mapping(address => uint256) private _balances;

  mapping(address => mapping(address => uint256)) private _allowances;

  uint256 private _totalSupply;

  string private _name;
  string private _symbol;

  function initialize(string memory name_, string memory symbol_) internal {
    _name = name_;
    _symbol = symbol_;
  }

  /**
   * @dev Returns the name of the token.
   */
  function name() public view virtual override returns (string memory) {
    return _name;
  }

  /**
   * @dev Returns the symbol of the token, usually a shorter version of the
   * name.
   */
  function symbol() public view virtual override returns (string memory) {
    return _symbol;
  }

  /**
   * @dev Returns the number of decimals used to get its user representation.
   * For example, if `decimals` equals `2`, a balance of `505` tokens should
   * be displayed to a user as `5,05` (`505 / 10 ** 2`).
   *
   * Tokens usually opt for a value of 18, imitating the relationship between
   * Ether and Wei. This is the value {ERC20} uses, unless this function is
   * overridden;
   *
   * NOTE: This information is only used for _display_ purposes: it in
   * no way affects any of the arithmetic of the contract, including
   * {IERC20-balanceOf} and {IERC20-transfer}.
   */
  function decimals() public view virtual override returns (uint8) {
    return 18;
  }

  /**
   * @dev See {IERC20-totalSupply}.
   */
  function totalSupply() public view virtual override returns (uint256) {
    return _totalSupply;
  }

  /**
   * @dev See {IERC20-balanceOf}.
   */
  function balanceOf(address account) public view virtual override returns (uint256) {
    return _balances[account];
  }

  /**
   * @dev See {IERC20-transfer}.
   *
   * Requirements:
   *
   * - `recipient` cannot be the zero address.
   * - the caller must have a balance of at least `amount`.
   */
  function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
    _transfer(_msgSender(), recipient, amount);
    return true;
  }

  /**
   * @dev See {IERC20-allowance}.
   */
  function allowance(address owner, address spender)
    public
    view
    virtual
    override
    returns (uint256)
  {
    return _allowances[owner][spender];
  }

  /**
   * @dev See {IERC20-approve}.
   *
   * Requirements:
   *
   * - `spender` cannot be the zero address.
   */
  function approve(address spender, uint256 amount) public virtual override returns (bool) {
    _approve(_msgSender(), spender, amount);
    return true;
  }

  /**
   * @dev See {IERC20-transferFrom}.
   *
   * Emits an {Approval} event indicating the updated allowance. This is not
   * required by the EIP. See the note at the beginning of {ERC20}.
   *
   * Requirements:
   *
   * - `sender` and `recipient` cannot be the zero address.
   * - `sender` must have a balance of at least `amount`.
   * - the caller must have allowance for ``sender``'s tokens of at least
   * `amount`.
   */
  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) public virtual override returns (bool) {
    _transfer(sender, recipient, amount);

    uint256 currentAllowance = _allowances[sender][_msgSender()];
    require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
    _approve(sender, _msgSender(), currentAllowance - amount);

    return true;
  }

  /**
   * @dev Atomically increases the allowance granted to `spender` by the caller.
   *
   * This is an alternative to {approve} that can be used as a mitigation for
   * problems described in {IERC20-approve}.
   *
   * Emits an {Approval} event indicating the updated allowance.
   *
   * Requirements:
   *
   * - `spender` cannot be the zero address.
   */
  function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
    _approve(_msgSender(), spender, _allowances[_msgSender()][spender] + addedValue);
    return true;
  }

  /**
   * @dev Atomically decreases the allowance granted to `spender` by the caller.
   *
   * This is an alternative to {approve} that can be used as a mitigation for
   * problems described in {IERC20-approve}.
   *
   * Emits an {Approval} event indicating the updated allowance.
   *
   * Requirements:
   *
   * - `spender` cannot be the zero address.
   * - `spender` must have allowance for the caller of at least
   * `subtractedValue`.
   */
  function decreaseAllowance(address spender, uint256 subtractedValue)
    public
    virtual
    returns (bool)
  {
    uint256 currentAllowance = _allowances[_msgSender()][spender];
    require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
    _approve(_msgSender(), spender, currentAllowance - subtractedValue);

    return true;
  }

  /**
   * @dev Moves tokens `amount` from `sender` to `recipient`.
   *
   * This is internal function is equivalent to {transfer}, and can be used to
   * e.g. implement automatic token fees, slashing mechanisms, etc.
   *
   * Emits a {Transfer} event.
   *
   * Requirements:
   *
   * - `sender` cannot be the zero address.
   * - `recipient` cannot be the zero address.
   * - `sender` must have a balance of at least `amount`.
   */
  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  ) internal virtual {
    require(sender != address(0), "ERC20: transfer from the zero address");
    require(recipient != address(0), "ERC20: transfer to the zero address");

    _beforeTokenTransfer(sender, recipient, amount);

    uint256 senderBalance = _balances[sender];
    require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
    _balances[sender] = senderBalance - amount;
    _balances[recipient] += amount;

    emit Transfer(sender, recipient, amount);
  }

  /** @dev Creates `amount` tokens and assigns them to `account`, increasing
   * the total supply.
   *
   * Emits a {Transfer} event with `from` set to the zero address.
   *
   * Requirements:
   *
   * - `to` cannot be the zero address.
   */
  function _mint(address account, uint256 amount) internal virtual {
    require(account != address(0), "ERC20: mint to the zero address");

    _beforeTokenTransfer(address(0), account, amount);

    _totalSupply += amount;
    _balances[account] += amount;
    emit Transfer(address(0), account, amount);
  }

  /**
   * @dev Destroys `amount` tokens from `account`, reducing the
   * total supply.
   *
   * Emits a {Transfer} event with `to` set to the zero address.
   *
   * Requirements:
   *
   * - `account` cannot be the zero address.
   * - `account` must have at least `amount` tokens.
   */
  function _burn(address account, uint256 amount) internal virtual {
    require(account != address(0), "ERC20: burn from the zero address");

    _beforeTokenTransfer(account, address(0), amount);

    uint256 accountBalance = _balances[account];
    require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
    _balances[account] = accountBalance - amount;
    _totalSupply -= amount;

    emit Transfer(account, address(0), amount);
  }

  /**
   * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
   *
   * This internal function is equivalent to `approve`, and can be used to
   * e.g. set automatic allowances for certain subsystems, etc.
   *
   * Emits an {Approval} event.
   *
   * Requirements:
   *
   * - `owner` cannot be the zero address.
   * - `spender` cannot be the zero address.
   */
  function _approve(
    address owner,
    address spender,
    uint256 amount
  ) internal virtual {
    require(owner != address(0), "ERC20: approve from the zero address");
    require(spender != address(0), "ERC20: approve to the zero address");

    _allowances[owner][spender] = amount;
    emit Approval(owner, spender, amount);
  }

  /**
   * @dev Hook that is called before any transfer of tokens. This includes
   * minting and burning.
   *
   * Calling conditions:
   *
   * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
   * will be to transferred to `to`.
   * - when `from` is zero, `amount` tokens will be minted for `to`.
   * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
   * - `from` and `to` are never both zero.
   *
   * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual {}
}

contract SampleSyntheticToken is ERC20Initializable, Ownable, RedstoneConsumerNumericMock {
  bool private initialized;
  bytes32 public asset;
  address public broker;

  uint256 public constant MAX_SOLVENCY = 2**256 - 1;
  bytes32 public constant COLLATERAL_TOKEN = "ETH";
  uint256 public constant SOLVENCY_PRECISION = 1000; // 100%, 1 unit = 0.1%
  uint256 public constant MIN_SOLVENCY = 1200; // 120%, 1 unit = 0.1%
  uint256 public constant LIQUIDATION_BONUS = 50; // 5%, 1 unit = 0.1%

  mapping(address => uint256) public collateral;
  mapping(address => uint256) public debt;

  function initialize(
    bytes32 asset_,
    string memory name_,
    string memory symbol_
  ) external {
    require(!initialized);

    super.initialize(name_, symbol_);

    asset = asset_;

    initialized = true;
  }

  /**
   * @dev Mints koTokens increasing user's debt
   */
  function mint(uint256 amount) external payable remainsSolvent {
    super._mint(msg.sender, amount);
    debt[msg.sender] += amount;
    addCollateral();
  }

  /**
   * @dev Burns koTokens to reduce user debt
   */
  function burn(uint256 amount) external {
    require(debt[msg.sender] >= amount, "Cannot burn more than minted");
    debt[msg.sender] -= amount;
    super._burn(msg.sender, amount);
  }

  /**
   * @dev Adds collateral to user account
   * It could be done to increase the solvency ratio
   */
  function addCollateral() public payable virtual {
    collateral[msg.sender] += msg.value;
    emit CollateralAdded(msg.sender, msg.value, block.timestamp);
  }

  /**
   * @dev Removes outstanding collateral by paying out funds to depositor
   * The account must remain solvent after the operation
   */
  function removeCollateral(uint256 amount) external virtual remainsSolvent {
    require(collateral[msg.sender] >= amount, "Cannot remove more collateral than deposited");
    collateral[msg.sender] -= amount;
    payable(msg.sender).transfer(amount);
    emit CollateralRemoved(msg.sender, amount, block.timestamp);
  }

  /**
   * @dev Collateral amount expressed in ETH
   */
  function collateralOf(address account) public view virtual returns (uint256) {
    return collateral[account];
  }

  /**
   * @dev Collateral value expressed in USD
   */
  function collateralValueOf(address account) public view returns (uint256) {
    return collateralOf(account) * getOracleNumericValueFromTxMsg(COLLATERAL_TOKEN);
  }

  /**
   * @dev Debt of the account (number of koTokens minted)
   */
  function debtOf(address account) public view returns (uint256) {
    return debt[account];
  }

  /**
   * @dev Debt of the account expressed in USD
   */
  function debtValueOf(address account) public view returns (uint256) {
    return debt[account] * getOracleNumericValueFromTxMsg(asset);
  }

  /**
   * @dev A ratio between the value of collateral and debt of the account
   * It's expressed in permills - 0.1% (ratio 1 to 1 is equal to 1000 units)
   * To leave a margin for price movement and liquidation it must remain safely abot 1000
   */
  function solvencyOf(address account) public view returns (uint256) {
    if (debtValueOf(account) == 0) {
      return MAX_SOLVENCY;
    } else {
      return (collateralValueOf(account) * SOLVENCY_PRECISION) / debtValueOf(account);
    }
  }

  /**
   * @dev Value of komodo tokens held by given account at the current market price
   */
  function balanceValueOf(address account) public view returns (uint256) {
    return balanceOf(account) * getOracleNumericValueFromTxMsg(asset);
  }

  /**
   * @dev Total value of all minted komodo tokens at the current market price
   */
  function totalValue() public view returns (uint256) {
    return totalSupply() * getOracleNumericValueFromTxMsg(asset);
  }

  function liquidate(address account, uint256 amount) public {
    require(solvencyOf(account) < MIN_SOLVENCY, "Cannot liquidate a solvent account");
    this.transferFrom(msg.sender, account, amount);
    super._burn(account, amount);
    debt[account] -= amount;

    // Liquidator reward
    uint256 collateralRepayment = (amount * getOracleNumericValueFromTxMsg(asset)) /
      getOracleNumericValueFromTxMsg(COLLATERAL_TOKEN);
    uint256 bonus = (collateralRepayment * LIQUIDATION_BONUS) / SOLVENCY_PRECISION;

    uint256 repaymentWithBonus = collateralRepayment + bonus;
    collateral[account] -= repaymentWithBonus;
    payable(msg.sender).transfer(repaymentWithBonus);

    require(solvencyOf(account) >= MIN_SOLVENCY, "Account must be solvent after liquidation");
  }

  modifier remainsSolvent() {
    _;
    require(solvencyOf(msg.sender) >= MIN_SOLVENCY, "The account must remain solvent");
  }

  // EVENTS
  event CollateralAdded(address account, uint256 val, uint256 time);
  event CollateralRemoved(address account, uint256 val, uint256 time);
}
