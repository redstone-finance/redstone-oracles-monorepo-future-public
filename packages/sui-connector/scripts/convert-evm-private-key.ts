import "dotenv/config";
import { hexlify } from "ethers/lib/utils";
import { makeSuiKeypair } from "../src";

const SHOW_PRIVATE_KEY = false;

function main(showPrivateKey: boolean) {
  const keypair = makeSuiKeypair();

  console.log(`SUI_ADDRESS=${keypair.toSuiAddress()}`);
  console.log(`SUI_PUBLIC_KEY=${hexlify(keypair.getPublicKey().toRawBytes())}`);

  if (!showPrivateKey) {
    return;
  }
  console.log(`SUI_PRIVATE_KEY=${keypair.getSecretKey()}`);
  console.log(`sui keytool import ${keypair.getSecretKey()} secp256k1`);
}

main(SHOW_PRIVATE_KEY);
