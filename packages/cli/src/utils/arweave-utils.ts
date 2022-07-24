import Arweave from "arweave";
import fs from "fs";
import { ArWallet, SmartWeaveNodeFactory } from "redstone-smartweave";
import deployedContracts from "redstone-oracles-smartweave-contracts/deployed-contracts.json";

const oracleRegistryContractId = deployedContracts["oracle-registry"];

export const initArweave = () => {
  return Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });
};

export const getWallet = (walletPath: string) => {
  const rawWallet = fs.readFileSync(walletPath, "utf-8");
  return JSON.parse(rawWallet);
};

export const getContract = (contractId: string) => {
  const arweave = initArweave();
  return SmartWeaveNodeFactory.memCached(arweave, 1).contract(contractId);
};

export const connectWalletToContract = (wallet: ArWallet) => {
  const contract = getContract(oracleRegistryContractId);
  return contract.connect(wallet);
};

export const getOracleRegistryContract = (walletPath: string) => {
  const wallet = getWallet(walletPath);
  return connectWalletToContract(wallet);
};
