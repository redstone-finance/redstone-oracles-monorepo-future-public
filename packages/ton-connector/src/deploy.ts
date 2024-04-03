import { NetworkProvider, compile } from "@ton/blueprint";
import { Address, Cell } from "@ton/core";
import fs from "fs";
import { TonContract } from "./TonContract";
import { TonContractDeployer } from "./TonContractDeployer";
import { TonContractError } from "./TonContractError";
import { config } from "./config";
import { BlueprintTonNetwork } from "./network/BlueprintTonNetwork";
import { AnyTonOpenedContract, TonNetwork } from "./network/TonNetwork";

export async function deploy<
  C extends TonContract,
  A extends { contract: AnyTonOpenedContract<C> },
  D extends TonContractDeployer<C, A>,
>(
  name: string,
  provider: NetworkProvider,
  deployerProvider: (network: TonNetwork, code: Cell) => D,
  nameSuffix?: string
): Promise<A | undefined> {
  const code: Cell = await compile(name);

  const deployer = deployerProvider(
    new BlueprintTonNetwork(provider, config),
    code
  );

  try {
    const contract = await deployer.getAdapter();
    await deployer.waitForTransaction("");

    await saveAddress(name, contract.contract.address);

    return contract;
  } catch (e) {
    console.warn((e as Error).message);

    await saveAddress(
      name,
      (e as TonContractError).contract.address,
      nameSuffix
    );
  }

  return undefined;
}

function getFilename(name: string, nameSuffix?: string) {
  return `deploy/${name}${nameSuffix ? `_${nameSuffix}` : ""}.address`;
}

async function saveAddress(
  name: string,
  address: Address,
  nameSuffix?: string
) {
  const filename = getFilename(name, nameSuffix);
  await fs.promises.writeFile(filename, address.toString());

  console.log(`Address '${address.toString()}' saved to file ${filename}.`);
}

export async function loadAddress(name: string, nameSuffix?: string) {
  return await fs.promises.readFile(getFilename(name, nameSuffix), "utf8");
}
