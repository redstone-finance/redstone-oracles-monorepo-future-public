import { PackageDeployer, Wallet } from "@atlantis-l/radix-tool";
import { RadixClient } from "../../src";

export class RadixPackageDeployer extends RadixClient {
  public async deployPackage(
    wasm: Uint8Array,
    rpd: Uint8Array,
    feeLock: number
  ) {
    const wallet = new Wallet(
      await this.getAccountAddress(),
      this.signer.publicKey(),
      this.signer
    );

    const deployer = new PackageDeployer(this.networkId, wallet);
    deployer.feeLock = `${feeLock}`;

    const result = await deployer.deploy(
      wasm,
      rpd,
      undefined,
      await this.getCurrentEpochNumber()
    );

    console.log(result);

    const transactionId = result.transactionId!;
    await this.waitForCommit(transactionId);

    const output = await this.apiClient.getTransactionDetails(transactionId);
    console.debug(output);

    return (output[1] as string[])[0];
  }
}
