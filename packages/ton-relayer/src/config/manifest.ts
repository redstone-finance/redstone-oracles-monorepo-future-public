import fs from "fs";
import path from "path";
import { config } from "./index";

type Manifest = {
  workchain: number;
  updateTriggers: {
    timeSinceLastUpdateInMilliseconds: number;
  };
  adapterContract: string;
  dataServiceId: string;
  priceFeeds: [string: string];
};

export const manifest = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "..", "relayer-manifests", config.manifestFile),
    {
      encoding: "utf-8",
    }
  )
) as Manifest;
