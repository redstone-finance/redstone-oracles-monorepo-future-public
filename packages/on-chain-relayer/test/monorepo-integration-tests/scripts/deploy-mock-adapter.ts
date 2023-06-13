import { ethers } from "hardhat";
import fs from "fs";

(async () => {
  const adapterContractFactory = await ethers.getContractFactory(
    "PriceFeedsAdapterWithoutRoundsOneSignerMock"
  );
  const address = (await adapterContractFactory.deploy()).address;
  fs.writeFileSync("adapter-contract-address.txt", address);
})();
