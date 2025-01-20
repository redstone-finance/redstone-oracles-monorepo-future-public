import { toBase64 } from "@mysten/bcs";
import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { MultiSigPublicKey } from "@mysten/sui/multisig";
import { hexlify } from "ethers/lib/utils";

const THRESHOLD_FACTOR = 2 / 3;
export const MULTI_SIG_PK_HEXES = [
  "0x480d1e346aed775cfc97446ab43f87670b3499e5a0a9e222d84d4d4e3aa8ca22",
];

export function getMultiSigPublicKey(pkHexes: string[]) {
  const pks = pkHexes.map((pkHex) =>
    toBase64(Buffer.from(pkHex.replace("0x", ""), "hex"))
  );

  return MultiSigPublicKey.fromPublicKeys({
    threshold: Math.ceil(pkHexes.length * THRESHOLD_FACTOR),
    publicKeys: pks.map((pk) => ({
      publicKey: new Ed25519PublicKey(pk),
      weight: 1,
    })),
  });
}

function getMultiSigAddress(pkHexes: string[]) {
  const multiSigPublicKey = getMultiSigPublicKey(pkHexes);
  const multiSigAddress = multiSigPublicKey.toSuiAddress();
  const multiSigPublicKeyHex = hexlify(multiSigPublicKey.toRawBytes());

  console.log({
    multiSigAddress,
    multiSigPublicKeyHex,
  });
}

function main() {
  getMultiSigAddress(MULTI_SIG_PK_HEXES);
}

void main();
