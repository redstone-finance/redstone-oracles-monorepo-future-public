import axios from "axios";
import { readFileSync } from "fs";
import { resolve } from "path";

const NPM_REGISTRY_URL = `https://registry.npmjs.org/@redstone-finance/cli/latest`;

interface NpmRegistryResponse {
  version: string;
}

interface PackageJson {
  version: string;
}

const fetchLatestNpmPackageVersion = async () => {
  try {
    const npmRegistryResponse =
      await axios.get<NpmRegistryResponse>(NPM_REGISTRY_URL);
    return npmRegistryResponse.data.version;
  } catch {
    console.error(
      "Cannot check latest version of RedStone CLI npm package, please report the issue"
    );
    process.exit(1);
  }
};

const getPackageJsonVersion = () => {
  const packageJson = JSON.parse(
    readFileSync(resolve(__dirname, "../", "package.json"), "utf-8")
  ) as PackageJson;
  return packageJson.version;
};

export const checkIfNewestVersionIsUsed = async () => {
  const latestVersion = await fetchLatestNpmPackageVersion();
  const versionFromPackageJson = getPackageJsonVersion();
  if (versionFromPackageJson !== latestVersion) {
    console.error(
      "Obsolete npm package version used, please update RedStone CLI by running npm update @redstone-finance/cli --save or yarn up @redstone-finance/cli"
    );
    process.exit(1);
  }
};
