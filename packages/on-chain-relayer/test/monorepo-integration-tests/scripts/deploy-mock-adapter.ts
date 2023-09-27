import { ethers } from "hardhat";
import fs from "fs";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const adapterContractFactory = await ethers.getContractFactory(
    "PriceFeedsAdapterWithRoundsOneSignerMock"
  );
  const address = (await adapterContractFactory.deploy()).address;
  fs.writeFileSync("adapter-contract-address.txt", address);
})();
