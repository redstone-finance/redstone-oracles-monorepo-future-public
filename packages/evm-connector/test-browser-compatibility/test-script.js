import { ethers } from "ethers";
import { WrapperBuilder } from "../src/index";

const provider = new ethers.providers.JsonRpcProvider(
  "https://ethereum.publicnode.com"
);

const contract = new ethers.Contract(
  "0x76A495b0bFfb53ef3F0E94ef0763e03cE410835C",
  [
    "function updateDataFeedsValues(uint256 dataPackagesTimestamp) external",
    "function getUniqueSignersThreshold() public view returns (uint8)",
  ],
  provider
);

const builder = new WrapperBuilder(contract);

const contractWrapped = builder.usingDataService({
  dataPackagesIds: ["pufETH/ETH"],
  dataServiceId: "redstone-primary-prod",
});

async function populateTx() {
  const tx = await contractWrapped.populateTransaction.updateDataFeedsValues(0);
  const txJson = JSON.stringify(tx, null, 4);
  console.log(txJson);
  document.getElementById("code").textContent = txJson;
}

populateTx();
