import {
  CasperClient,
  CLPublicKey,
  CLValue,
  Contracts,
  DeployUtil,
  Keys,
  RuntimeArgs,
} from "casper-js-sdk";
import { ICasperConnection } from "../casper/ICasperConnection";
import { CasperContract } from "./CasperContract";

const DEFAULT_DEPLOY_TTL = 1800000;

export class VersionedCasperContract extends CasperContract {
  constructor(
    connection: ICasperConnection,
    private readonly packageHash: string
  ) {
    super(connection);

    this.packageHash = packageHash.startsWith("0x")
      ? packageHash.substring(2)
      : packageHash;
  }

  override async queryContractData(
    path?: string[],
    casperClient?: CasperClient,
    stateRootHash?: string
  ) {
    await this.checkContractVersion();

    return (await super.queryContractData(
      path,
      casperClient,
      stateRootHash
    )) as unknown;
  }

  override async queryContractDictionary(
    dictionaryName: string,
    dictionaryItemKey: string,
    stateRootHash?: string,
    casperClient?: CasperClient
  ): Promise<CLValue> {
    await this.checkContractVersion();

    return await super.queryContractDictionary(
      dictionaryName,
      dictionaryItemKey,
      stateRootHash,
      casperClient
    );
  }

  override callEntrypoint(
    entryPoint: string,
    args: RuntimeArgs,
    sender: CLPublicKey,
    chainName: string,
    paymentAmount: string,
    signingKeys: Keys.AsymmetricKey[] = [],
    ttl: number = DEFAULT_DEPLOY_TTL
  ): DeployUtil.Deploy {
    const contractHashAsByteArray = Contracts.contractHashToByteArray(
      this.packageHash
    );

    const deploy = DeployUtil.makeDeploy(
      new DeployUtil.DeployParams(sender, chainName, 1, ttl),
      DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
        contractHashAsByteArray,
        null,
        entryPoint,
        args
      ),
      DeployUtil.standardPayment(paymentAmount)
    );

    return deploy.sign(signingKeys);
  }

  private async checkContractVersion() {
    if (this.contractHash) {
      return;
    }

    const res = await this.connection.queryGlobalState(
      `hash-${this.packageHash}`
    );

    if (!res.ContractPackage || !res.ContractPackage.versions.length) {
      throw new Error("Unable to fetch contract version");
    }

    const versions = res.ContractPackage.versions;
    versions.sort((x, y) => y.contractVersion - x.contractVersion);

    this.setContractHash(
      versions[0].contractHash.replace("contract-", "hash-")
    );
  }
}
