import { NetworkProvider } from "@ton/blueprint";
import { Cell } from "@ton/core";
import { TonNetwork } from "../src";
import { deploy } from "../src/deploy";
import { SingleFeedManInitData } from "../src/single-feed-man/SingleFeedManInitData";
import { TonSingleFeedManContractDeployer } from "../src/single-feed-man/TonSingleFeedManContractDeployer";
import { TonSingleFeedMan } from "../wrappers/TonSingleFeedMan";

export async function run(provider: NetworkProvider) {
  await deploy(
    TonSingleFeedMan.getName(),
    provider,
    (network: TonNetwork, code: Cell) => {
      return new TonSingleFeedManContractDeployer(
        network,
        code,
        new SingleFeedManInitData("ETH", 1, [
          "0x109B4A318A4F5DDCBCA6349B45F881B4137DEAFB",
          "0x12470F7ABA85C8B81D63137DD5925D6EE114952B",
          "0x1EA62D73EDF8AC05DFCEA1A34B9796E937A29EFF",
          "0x2C59617248994D12816EE1FA77CE0A64EEB456BF",
          "0x83CBA8C619FB629B81A65C2E67FE15CF3E3C9747",
          "0xf786a909d559f5dee2dc6706d8e5a81728a39ae9",
        ])
      );
    }
  );
}
