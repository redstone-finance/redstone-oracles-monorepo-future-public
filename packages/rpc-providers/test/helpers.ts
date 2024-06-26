import { Contract, Wallet, providers } from "ethers";
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.provider = new Proxy(provider, {
      get: function (target: providers.JsonRpcProvider, property, receiver) {
        const originalValue = Reflect.get(
          target,
          property,
          receiver
        ) as unknown;
        if (
          typeof originalValue === "function" &&
          Reflect.has(self.toMock, property)
        ) {
          return function (...args: unknown[]) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
            return (self.toMock as any)[property](...args);
          };
        }
        return originalValue;
      },
      set(_target: providers.JsonRpcProvider, p, newValue) {
        if (p.toString() === "call") {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          self.set({ ...toMock, call: newValue });
          return true;
        }
        return false;
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
  provider: providers.Provider,
  multicall3Address = "0x" + "0".repeat(40)
): Promise<Counter> {
  let contractFactory = await hardhat.ethers.getContractFactory("Counter");

  const wallet = new Wallet(TEST_PRIVATE_KEY).connect(provider);
  contractFactory = contractFactory.connect(wallet);
  const contract = await contractFactory.deploy(multicall3Address);
  await contract.deployed();

  return new Contract(contract.address, contract.interface, wallet) as Counter;
}
