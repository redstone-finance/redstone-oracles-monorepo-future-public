import abracadabraKavaBtc from "./abracadabraKavaBtc.json";
import abracadabraKavaEth from "./abracadabraKavaEth.json";
import abracadabraKavaUsdt from "./abracadabraKavaUsdt.json";
import arbitrumAngleAgeur from "./arbitrumAngleAgeur.json";
import arbitrumPremia from "./arbitrumPremia.json";
import arbitrumSusdeRateProvider from "./arbitrumSusdeRateProvider.json";
import arbitrumWeetheth from "./arbitrumWeetheth.json";
import arbitrumWeethfundamental from "./arbitrumWeethfundamental.json";
import blastBtc from "./blastBtc.json";
import blastEth from "./blastEth.json";
import blastLrts from "./blastLrts.json";
import blastTestnet from "./blastTestnet.json";
import blastUsdb from "./blastUsdb.json";
import bnbEzetheth from "./bnbEzetheth.json";
import cadenceCantoAtom from "./cadenceCantoAtom.json";
import cadenceCantoCanto from "./cadenceCantoCanto.json";
import cadenceCantoCnote from "./cadenceCantoCnote.json";
import cadenceCantoEth from "./cadenceCantoEth.json";
import cadenceCantoTestnet from "./cadenceCantoTestnet.json";
import cadenceCantoUsdc from "./cadenceCantoUsdc.json";
import cadenceCantoUsdt from "./cadenceCantoUsdt.json";
import ethereumApxetheth from "./ethereumApxetheth.json";
import ethereumC3m from "./ethereumC3m.json";
import ethereumEtherfiWeeth from "./ethereumEtherfiWeeth.json";
import ethereumEtherfiWeetheth from "./ethereumEtherfiWeetheth.json";
import ethereumEthxeth from "./ethereumEthxeth.json";
import ethereumEusd from "./ethereumEusd.json";
import ethereumEzetheth from "./ethereumEzetheth.json";
import ethereumPufetheth from "./ethereumPufetheth.json";
import ethereumRsetheth from "./ethereumRsetheth.json";
import ethereumRswetheth from "./ethereumRswetheth.json";
import ethereumStakewiseOsetheth from "./ethereumStakewiseOsetheth.json";
import ethereumUsdeSusde from "./ethereumUsdeSusde.json";
import etherlinkGhostnetTezosXtzEthBtc from "./etherlinkGhostnetTezosXtzEthBtc.json";
import hubble from "./hubble.json";
import hubbleAylinTestnet from "./hubbleAylinTestnet.json";
import hubbleExchangeMainnet from "./hubbleExchangeMainnet.json";
import mantaLayerBank from "./mantaLayerBank.json";
import mantleEth from "./mantleEth.json";
import mantleMnt from "./mantleMnt.json";
import mantleTest from "./mantleTest.json";
import mantleUsdeSusde from "./mantleUsdeSusde.json";
import mantleUsdt from "./mantleUsdt.json";
import mantleWstEth from "./mantleWstEth.json";
import mentoBaklavaMultisig from "./mentoBaklavaMultisig.json";
import mentoCeloMainnet from "./mentoCeloMainnet.json";
import modeLayerBank from "./modeLayerBank.json";
import realGbp from "./realGbp.json";
import realXau from "./realXau.json";
import sepoliaAngleAgeur from "./sepoliaAngleAgeur.json";
import sepoliaVegaBtc from "./sepoliaVegaBtc.json";
import sepoliaVegaEth from "./sepoliaVegaEth.json";
import sepoliaVegaSol from "./sepoliaVegaSol.json";
import sepoliaVegaXau from "./sepoliaVegaXau.json";
import sepoliaVegaXrp from "./sepoliaVegaXrp.json";
import sepoliaVenusXvs from "./sepoliaVenusXvs.json";
import staderEthx from "./staderEthx.json";
import swell from "./swell.json";
import venusBnbTestnet from "./venusBnbTestnet.json";
import venusBnbTrx from "./venusBnbTrx.json";
import venusMainnetXvs from "./venusMainnetXvs.json";

import { OnChainRelayerManifest } from "../src";

// This file contains mapping from manifest name to manifest content
// Which can be very useful as a source of truth, and can be easily use
// in JS/TS code. We export it as an object for being able to iterate
// through it and e.g. identify relayer name by an adapter address
export default {
  abracadabraKavaBtc,
  abracadabraKavaEth,
  abracadabraKavaUsdt,
  arbitrumPremia,
  arbitrumAngleAgeur,
  arbitrumSusdeRateProvider,
  arbitrumWeetheth,
  arbitrumWeethfundamental,
  bnbEzetheth,
  blastBtc,
  blastEth,
  blastLrts,
  blastTestnet,
  blastUsdb,
  cadenceCantoAtom,
  cadenceCantoCanto,
  cadenceCantoCnote,
  cadenceCantoEth,
  cadenceCantoTestnet,
  cadenceCantoUsdc,
  cadenceCantoUsdt,
  ethereumApxetheth,
  ethereumC3m,
  ethereumEusd,
  ethereumEthxeth,
  ethereumEtherfiWeeth,
  ethereumEtherfiWeetheth,
  ethereumEzetheth,
  ethereumPufetheth,
  ethereumRsetheth,
  ethereumRswetheth,
  ethereumStakewiseOsetheth,
  ethereumUsdeSusde,
  etherlinkGhostnetTezosXtzEthBtc,
  hubble,
  hubbleAylinTestnet,
  hubbleExchangeMainnet,
  mantleEth,
  mantaLayerBank,
  mantleMnt,
  mantleTest,
  mantleUsdeSusde,
  mantleUsdt,
  mantleWstEth,
  mentoBaklavaMultisig,
  mentoCeloMainnet,
  modeLayerBank,
  realGbp,
  realXau,
  sepoliaAngleAgeur,
  sepoliaVegaBtc,
  sepoliaVegaEth,
  sepoliaVegaSol,
  sepoliaVegaXau,
  sepoliaVegaXrp,
  sepoliaVenusXvs,
  staderEthx,
  swell,
  venusBnbTestnet,
  venusBnbTrx,
  venusMainnetXvs,
} as Record<string, OnChainRelayerManifest>;
