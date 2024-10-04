import "dotenv/config";
import { readSsmRpcUrls } from "./read-ssm-rpc-urls";

const printSsmRpcUrls = async () => {
  const rpcUrlsPerChain = await readSsmRpcUrls();
  for (const [name, { chainId, rpcUrls }] of Object.entries(rpcUrlsPerChain)) {
    console.log(
      "\n---------------------------------------------------------------------\n"
    );
    console.log(`${name} (${chainId}): `);
    for (const rpcUrl of rpcUrls) {
      console.log(rpcUrl);
    }
  }
};

void printSsmRpcUrls();
