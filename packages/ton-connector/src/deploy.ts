import { TonContract } from "./TonContract";
import { AnyTonOpenedContract, TonNetwork } from "./network/TonNetwork";
import { TonContractDeployer } from "./TonContractDeployer";
import { compile, NetworkProvider } from "@ton/blueprint";
import { Address, Cell } from "@ton/core";
import { BlueprintTonNetwork } from "./network/BlueprintTonNetwork";
import { config } from "./config";
import { TonContractError } from "./TonContractError";
import fs from "fs";

export async function deploy<
  C extends TonContract,
  A extends { contract: AnyTonOpenedContract<C> },
  D extends TonContractDeployer<C, A>,
>(
  name: string,
  provider: NetworkProvider,
  deployerProvider: (network: TonNetwork, code: Cell) => D
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

    await saveAddress(name, (e as TonContractError).contract.address);
  }

  return undefined;
}

async function saveAddress(name: string, address: Address) {
  const fileName = `deploy/${name}.address`;
  await fs.promises.writeFile(fileName, address.toString());

  console.log(`Address '${address.toString()}' saved to file ${fileName}.`);
}
