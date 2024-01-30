import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { ethers, upgrades, network } from "hardhat";

const DEPLOYED_CONTRACT_ADDRESSES_FILE = `./${network.name}-deployed-contracts.json`;
const INITIAL_SUPPLY = 1_000_000_000;
const AUTHORISED_SLASHER = "0x0000000000000000000000000000000000000000";
const DELAY_FOR_UNLOCKING_SECONDS = 30 * 24 * 3600; // 30 days
const VESTING_START_TIMESTAMP_SECONDS = Math.round(Date.now() / 1000);
const VESTING_CLIFF_DURATION_SECONDS = 1 * 30 * 24 * 3600; // 1 month
const VESTING_DURATION_SECONDS = 11 * 30 * 24 * 3600; // 11 months
const VESTING_ALLOCATION = {
  "0x0C39486f770B26F5527BBBf942726537986Cd7eb": 3_000_000,
  "0x926E370fD53c23f8B71ad2B3217b227E41A92b12": 1_000_000,
  "0xf786a909D559F5Dee2dc6706d8e5A81728a39aE9": 1_000_000,
  "0x3a7d971De367FE15D164CDD952F64205F2D9f10c": 1_000_000,
  "0xAAb9568f7165E66AcaFF50B705C3f3e964cbD24f": 1_000_000,
  "0x11fFFc9970c41B9bFB9Aa35Be838d39bce918CfF": 1_000_000,
  "0xdBcC2C6c892C8d3e3Fe4D325fEc810B7376A5Ed6": 1_000_000,
  "0x981bdA8276ae93F567922497153de7A5683708d3": 1_000_000,
  "0x3BEFDd935b50F172e696A5187DBaCfEf0D208e48": 1_000_000,
  "0xc1D5b940659e57b7bDF8870CDfC43f41Ca699460": 1_000_000,
  "0x1Cd8F9627a2838a7DAE6b98CF71c08B9CbF5174a": 1_000_000,
  "0xbC5a06815ee80dE7d20071703C1F1B8fC511c7d4": 1_000_000,
  "0xe9Fa2869C5f6fC3A0933981825564FD90573A86D": 1_000_000,
  "0xDf6b1cA313beE470D0142279791Fa760ABF5C537": 1_000_000,
  "0xa50abc5D76dAb99d5fe59FD32f239Bd37d55025f": 1_000_000,
  "0x496f4E8aC11076350A59b88D2ad62bc20d410EA3": 1_000_000,
  "0x41FB6b8d0f586E73d575bC57CFD29142B3214A47": 1_000_000,
  "0xC1068312a6333e6601f937c4773065B70D38A5bF": 1_000_000,
  "0xAE9D49Ea64DF38B9fcbC238bc7004a1421f7eeE8": 1_000_000,
};

interface VestingContractConfig {
  tokenAddress: string;
  lockingContractAddress: string;
  allocation: number;
  beneficiaryAddress: string;
}

deployAll();

async function deployAll() {
  console.log("Deploying token contract");
  const tokenAddress = await deployTokenContract();
  saveDeployedAddress("token", tokenAddress);
  console.log(`Token deployed at: ${tokenAddress}`);

  console.log("\nDeploying locking contract");
  const lockingAddress = await deployLockingContract(tokenAddress);
  saveDeployedAddress("locking", lockingAddress);
  console.log(`Locking contract deployed at: ${lockingAddress}`);

  console.log("\nDeploying vesting contracts");
  await prepareAllVestingContracts(tokenAddress, lockingAddress);
  console.log("Deployed all vesting contracts");
}

async function deployTokenContract() {
  const TokenContractFactory = await ethers.getContractFactory("RedstoneToken");
  const contract = await TokenContractFactory.deploy(toEthBN(INITIAL_SUPPLY));
  await contract.deployed();
  return contract.address;
}

async function deployLockingContract(tokenAddress: string) {
  const LockingRegistryFactory =
    await ethers.getContractFactory("LockingRegistry");
  const locking = await upgrades.deployProxy(LockingRegistryFactory, [
    tokenAddress,
    AUTHORISED_SLASHER,
    DELAY_FOR_UNLOCKING_SECONDS,
  ]);
  return locking.address;
}

async function prepareAllVestingContracts(
  tokenAddress: string,
  lockingContractAddress: string
) {
  for (const [beneficiaryAddress, allocation] of Object.entries(
    VESTING_ALLOCATION
  )) {
    // Deploying a vesting contract
    const vestingContractAddress = await deployVestingContract({
      tokenAddress,
      lockingContractAddress,
      beneficiaryAddress,
      allocation,
    });

    // Transfering tokens to the deployed vesting contract
    await transferRedstoneTokens(
      tokenAddress,
      vestingContractAddress,
      allocation
    );
  }
}

async function transferRedstoneTokens(
  tokenAddress: string,
  recipient: string,
  amount: number
) {
  console.log(`Transfering ${amount} RedStone tokens to the vesting contract`);
  const TokenContractFactory = await ethers.getContractFactory("RedstoneToken");
  const token = TokenContractFactory.attach(tokenAddress);
  const tx = await token.transfer(recipient, toEthBN(amount));
  console.log(`Tx sent. Waiting for confirmation: ${tx.hash}`);
  await tx.wait();
  console.log(`Tx confirmed: ${tx.hash}`);
}

async function deployVestingContract(vestingConfig: VestingContractConfig) {
  const { beneficiaryAddress } = vestingConfig;
  console.log(
    `\nDeploying a vesting contract for address: ${beneficiaryAddress}`
  );

  const VestingWalletFactory = await ethers.getContractFactory("VestingWallet");
  const vestingContract = await upgrades.deployProxy(VestingWalletFactory, [
    vestingConfig.tokenAddress,
    beneficiaryAddress,
    vestingConfig.lockingContractAddress,
    toEthBN(vestingConfig.allocation),
    VESTING_START_TIMESTAMP_SECONDS,
    VESTING_CLIFF_DURATION_SECONDS,
    VESTING_DURATION_SECONDS,
  ]);

  saveDeployedAddress(`vesting-${beneficiaryAddress}`, vestingContract.address);
  console.log(
    `Vesting contract for ${beneficiaryAddress} deployed at: ${vestingContract.address}`
  );

  return vestingContract.address;
}

function toEthBN(amount: number): BigNumber {
  return parseEther(String(amount));
}

function saveDeployedAddress(contractName: string, address: string) {
  const fileName = DEPLOYED_CONTRACT_ADDRESSES_FILE;
  console.log(
    `Saving ${address} as address for ${contractName} to ${fileName}`
  );
  const savedAddresses = existsSync(fileName)
    ? JSON.parse(readFileSync(fileName, "utf-8"))
    : {};
  writeFileSync(
    DEPLOYED_CONTRACT_ADDRESSES_FILE,
    JSON.stringify(
      {
        ...savedAddresses,
        [contractName]: address,
      },
      null,
      2
    ) + "\n"
  );
}
