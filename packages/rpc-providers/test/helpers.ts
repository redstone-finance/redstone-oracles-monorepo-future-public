import * as hardhat from "hardhat";

export async function deployCounter() {
  const ContractFactory = await hardhat.ethers.getContractFactory("Counter");
  const contract = await ContractFactory.deploy();
  await contract.deployed();
  return contract;
}
