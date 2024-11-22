import axios from "axios";
import { version } from "../package.json";

const NPM_REGISTRY_URL = `https://registry.npmjs.org/@redstone-finance/cli/latest`;

interface NpmRegistryResponse {
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

export const checkIfNewestVersionIsUsed = async () => {
  const latestVersion = await fetchLatestNpmPackageVersion();
  if (version !== latestVersion) {
    console.error(
      "Obsolete npm package version used, please update RedStone CLI by running npm update @redstone-finance/cli --save or yarn up @redstone-finance/cli"
    );
    process.exit(1);
  }
};
