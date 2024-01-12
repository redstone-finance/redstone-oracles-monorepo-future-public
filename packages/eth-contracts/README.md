# 🔗 redstone-eth-contracts

[![Discord](https://img.shields.io/discord/786251205008949258?logo=discord)](https://discord.gg/2CT6hN6C)
[![Twitter](https://img.shields.io/twitter/follow/redstone_defi?style=flat&logo=twitter)](https://twitter.com/intent/follow?screen_name=limestone_defi)

This package contains an implementation of the main RedStone contracts with the business logic for its data providers and dispute resolutions.

## Contracts

### RedstoneToken.sol

A standard implementation of ERC20 token with an ability to mint more tokens by the authorized minter. The minter role can be passed to another address only by the existing minter. The total token supply is limited by the MAX_SUPPLY parameter.

This contract is not upgradable.

### LockingRegistry.sol

This contract contains the logic of the RedStone tokens locking.

#### Locking tokens

Data providers need to lock a specified amount of RedStone tokens (using the `lock(uint256 amountToLock)` method) in order to join RedStone oracle services and start receiving rewards for providing data.

#### Unlocking tokens

If the data provider would like to stop providing services with RedStone oracles, they can unlock the tokens. Firstly, they need to call the `requestUnlock(uint256 amountToUnlock)` method. Then, after waiting for `delayForUnlockingInSeconds` (will be set to 30 days) they can withdraw the locked tokens using the `completeUnlock()` method.

The waiting period is added so that RedStone consumers have enough time to remove the data provider address from their contracts. During the waiting period the data provider' tokens can still be slashed, which should motivate them to provide correct data during the waiting period (probably receiving less rewards).

There is a possibility that a data provider is not able to complete unlock if some part of its locked amount was slashed during the waiting period. In this case, they need to call the `requestUnlock` function again.

#### Slashing

The LockingRegistry contract has a mechanism of slashing (`slash(address slashedAddress, uint256 slashedAmount)` method), which can be performed only by a special authorized address (authorized slasher address). The authorised slasher can slash any amount from any user that locked their funds. This mechanism is created to "punish" misbehaved data providers.

Initially, we'll specify the RedStone team multisig wallet as the authorized slasher. In future, the DisputeResolutionContract will become the authorized slasher and it will be able to slash tokens automatically after the dispute settlement.

This contract is upgradable.

### VestingWallet.sol

This contract contains the logic of RedStone tokens vesting.

The main difference between the standard vesting is that during the vesting period, all the tokens (even unvested ones) can be locked in the LockingRegistry contract. This mechanism will be used by RedStone's first data providers, who will be able to lock their unvested tokens and start providing oracle services without the need to wait for the end of the vesting period.

#### Vesting initialization

Each vesting wallet contract will receive the following params during the initialization:

- `vestingToken_` - address of the RedStone token contract
- `beneficiaryAddress_` - address of the beneficiary (the only wallet which can release tokens from the VestingWallet)
- `lockingRegistry` - address of the LockingRegistry contract
- `allocation` - full amount of RedStone tokens on the VestingWallet
- `startTimestamp` - vesting start time
- `cliffDurationSeconds` - vesting cliff duration
- `vestingDurationSeconds` - vesting duration (without cliff)

#### Locking / unlocking tokens

As mentioned earlier, all the RedStone tokens on the VestingWallet contract balance can be locked (`lock(uint256 amount)`) and unlocked (`requestUnlock(uint256 amount)` and `completeUnlock()`) in the LockingRegistry.

#### Releasing tokens

Only the beneficiary wallet can release vested tokens that are not currently locked in the LockingRegistry using the `release(uint256 amount)` method.

This contract is upgradable.

### DisputeResolutionEngine.sol

This contract contains all the complex logic of disputes resolution. But it will be audited and deployed in longer future.

## Deployment

- Create a `.env` file with your PRIVATE_KEY and GOERLI_URL
- Install dependencies using `yarn install`
- Run `npx hardhat run src/deploy-all.ts --network goerli`

## License

BUSL-1.1
