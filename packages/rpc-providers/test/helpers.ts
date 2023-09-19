import { Wallet, Contract, providers } from "ethers";
import * as hardhat from "hardhat";
import { Counter } from "../typechain-types";

const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

type JsonRpcProviderKeys = keyof providers.JsonRpcProvider;
type ToMock = Partial<
  Record<JsonRpcProviderKeys, providers.JsonRpcProvider[JsonRpcProviderKeys]>
>;

export class HardhatProviderMocker {
  constructor(
    public provider: providers.JsonRpcProvider,
    public toMock: ToMock = {}
  ) {
    const self = this;
    this.provider = new Proxy(this.provider, {
      get: function (target: providers.JsonRpcProvider, property, receiver) {
        const originalValue = Reflect.get(target, property, receiver);
        if (
          typeof originalValue === "function" &&
          Reflect.has(self.toMock, property)
        ) {
          return function (...args: any[]) {
            return (self.toMock as any)[property](...args);
          };
        }
        return originalValue;
      },
    });
  }

  reset() {
    this.toMock = {};
  }

  set(toMock: ToMock) {
    this.toMock = toMock;
  }
}

export async function deployCounter(
  provider: providers.Provider
): Promise<Counter> {
  let contractFactory = await hardhat.ethers.getContractFactory("Counter");

  const wallet = new Wallet(TEST_PRIVATE_KEY).connect(provider);
  contractFactory = contractFactory.connect(wallet);
  const contract = await contractFactory.deploy();
  await contract.deployed();

  return new Contract(contract.address, contract.interface, wallet) as Counter;
}
