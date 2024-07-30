import arbitrumOneMultiFeed from "./arbitrumOneMultiFeed.json";
import mantleMultiFeed from "./mantleMultiFeed.json";
import modeMultiFeed from "./modeMultiFeed.json";
import optimismDevMultiFeed from "./optimismDevMultiFeed.json";
import sepoliaMultiFeed from "./sepoliaMultiFeed.json";
import zkLinkMultiFeed from "./zkLinkMultiFeed.json";

import _ from "lodash";
import { MultiFeedOnChainRelayerManifestSchema } from "../src/schemas";

// This file contains mapping from manifest name to manifest content
// Which can be very useful as a source of truth, and can be easily use
// in JS/TS code. We export it as an object for being able to iterate
// through it and e.g. identify relayer name by an adapter address

const allMultiFeedRelayersManifests = {
  arbitrumOneMultiFeed,
  modeMultiFeed,
  sepoliaMultiFeed,
  optimismDevMultiFeed,
  zkLinkMultiFeed,
  mantleMultiFeed,
};

const allMultiFeedRelayersParsedManifests = _.mapValues(
  allMultiFeedRelayersManifests,
  (manifest) => MultiFeedOnChainRelayerManifestSchema.parse(manifest)
);
export default allMultiFeedRelayersParsedManifests;
