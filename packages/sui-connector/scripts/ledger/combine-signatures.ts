import { hexlify } from "ethers/lib/utils";
import {
  getMultiSigPublicKey,
  MULTI_SIG_PK_HEXES,
} from "./get-multi-sig-address";

function combineSignatures(pkHexes: string[], signatures: string[]) {
  const multiSigPublicKey = getMultiSigPublicKey(pkHexes);

  const multiSigSignature =
    multiSigPublicKey.combinePartialSignatures(signatures);
  const multiSigAddress = multiSigPublicKey.toSuiAddress();

  const multiSigPublicKeyHex = hexlify(multiSigPublicKey.toRawBytes());
  console.log(multiSigAddress);

  console.log({
    multiSigSignature,
    multiSigAddress,
    multiSigPublicKeyHex,
  });

  return multiSigAddress;
}

combineSignatures(MULTI_SIG_PK_HEXES, [
  "ALnD0WOCu+oC6lCu1ouFzOM6d4RIgWp2n7RwJ5F6iLmTnS/0wR8a7M46oc6QwfsafM0szve/wMKsHxYgAlbTpARIDR40au13XPyXRGq0P4dnCzSZ5aCp4iLYTU1OOqjKIg==",
]);
