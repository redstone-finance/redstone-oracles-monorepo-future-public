import { CasperClient, CLPublicKey, DeployUtil } from "casper-js-sdk";
import { Deploy } from "casper-js-sdk/dist/lib/DeployUtil";
import { CasperNetworkName } from "./CasperConfig";
import { CasperConnection } from "./CasperConnection";
import type { CasperWalletInterface } from "./CasperWalletTypes";

export class WalletCasperConnection extends CasperConnection {
  constructor(
    casperClient: CasperClient,
    networkName: CasperNetworkName,
    private wallet: CasperWalletInterface
  ) {
    super(casperClient, networkName);
  }

  static makeWithWallet(
    wallet: CasperWalletInterface,
    networkName: CasperNetworkName,
    nodeUrl: string
  ) {
    const casperClient = new CasperClient(nodeUrl);

    return new WalletCasperConnection(casperClient, networkName, wallet);
  }

  override async getPublicKey() {
    return CLPublicKey.fromHex(await this.wallet.getActivePublicKey());
  }

  override async signDeploy(deploy: Deploy): Promise<Deploy> {
    const deployJson = DeployUtil.deployToJson(deploy);
    const signatures = await this.wallet.sign(
      JSON.stringify(deployJson),
      await this.wallet.getActivePublicKey()
    );

    if (signatures.cancelled) {
      throw new Error("Signing cancelled");
    }

    const signedDeploy = DeployUtil.setSignature(
      deploy,
      signatures.signature,
      await this.getPublicKey()
    );

    return signedDeploy;
  }
}
