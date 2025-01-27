import { Secp256k1PublicKey } from "@mysten/sui/keypairs/secp256k1";
import { arrayify, hexlify } from "ethers/lib/utils";
import { publicKeyConvert } from "secp256k1";

export function convertSecp256k1PublicKeyToSuiAddress(
  secp256k1PublicKey: string
) {
  const compressedPublicKey = publicKeyConvert(
    arrayify(secp256k1PublicKey),
    true
  );

  const suiPublicKey = new Secp256k1PublicKey(compressedPublicKey);
  const suiAddress = suiPublicKey.toSuiAddress();
  return {
    secp256k1PublicKey,
    compressedPublicKey: hexlify(compressedPublicKey),
    suiAddress,
    suiPublicKey: hexlify(suiPublicKey.toRawBytes()),
  };
}

const PUBLIC_KEYS = {
  main: {
    ssmParamPath:
      "/prod/on-chain-relayer/sui/mainnet/multi-feed/main/private-key",
    publicKey:
      "0x04d7985fa8c88c9801fd8d06b31169d61ae8730e6ac8d95b4af9fbe446747427a4a95582ef8acc0aececca4d40d97852bb64fef8d6f747d3c14d32708c178337e6",
    address: "0x9BF2021765E0102481eDe9e5B05963914255B0E8",
  },

  fallback: {
    ssmParamPath:
      "/prod/on-chain-relayer/sui/mainnet/multi-feed/fallback/private-key",
    publicKey:
      "0x0443168479f5f31e6bde33afe4b80a0d42dd816057a5af6e7fc2477f8777d92222a01c4a652a93eb91f301ba7b89f7a290c3acdb1794eec164add7eb8b5b837564",
    address: "0x0fE84Fbac41Accb3360150884B81b2Bb615908B2",
  },
  manual: {
    ssmParamPath:
      "/prod/on-chain-relayer/sui/mainnet/multi-feed/manual/private-key",
    publicKey:
      "0x04e3a296586b79545eeb02e78e82291b17aac18004b4e6d30c1afa2b8d32376b6759b23efdf76705becc6d125fd887fb5c1a29f46ed578bd2e74bc41e87b4b1848",
    address: "0x0502A26e16C4c915E0647bece301C93d71a0C15E",
  },
};

console.log(
  JSON.stringify(
    Object.fromEntries(
      Object.entries(PUBLIC_KEYS).map(([key, value]) => [
        key,
        convertSecp256k1PublicKeyToSuiAddress(value.publicKey),
      ])
    ),
    null,
    4
  )
);
