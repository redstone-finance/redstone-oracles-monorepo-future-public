import { Wallet } from "ethers";
import { ethers } from "hardhat";
import { config } from "../../config";
import { getProvider } from "./get-provider";

export const getManagerContract = async () => {
  const { privateKey, managerContractAddress } = config;

  const provider = getProvider();
  const signer = new Wallet(privateKey, provider);

  const MangerContractFactory = await ethers.getContractFactory(
    "PriceFeedsAdapter",
    signer
  );
  return MangerContractFactory.attach(managerContractAddress);
};
