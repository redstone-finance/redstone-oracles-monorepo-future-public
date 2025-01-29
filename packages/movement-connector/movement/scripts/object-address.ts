import { AccountAddress, createObjectAddress } from "@aptos-labs/ts-sdk";

const seed = "RedstonePriceAdapter";

function main() {
    const scriptArgs = process.argv.slice(2);
    const creatorAddress = scriptArgs[0];

    console.log(createObjectAddress(AccountAddress.fromString(creatorAddress), seed).toString());
}

void main();
