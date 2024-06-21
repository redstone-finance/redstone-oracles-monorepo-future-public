import abracadabraKavaBtc from "./abracadabraKavaBtc.json";
import abracadabraKavaEth from "./abracadabraKavaEth.json";
import abracadabraKavaUsdt from "./abracadabraKavaUsdt.json";
import arbitrumAngleAgeur from "./arbitrumAngleAgeur.json";
import arbitrumPremia from "./arbitrumPremia.json";
import arbitrumSusdeRateProvider from "./arbitrumSusdeRateProvider.json";
import arbitrumWeetheth from "./arbitrumWeetheth.json";
import arbitrumWeethfundamental from "./arbitrumWeethfundamental.json";
import arbitrumXvs from "./arbitrumXvs.json";
import b2MultiPriceFeed from "./b2MultiPriceFeed.json";
import baseBsdetheth from "./baseBsdetheth.json";
import basePufetheth from "./basePufetheth.json";
import baseUsdplus from "./baseUsdplus.json";
import berachainTestnetEth from "./berachainTestnetEth.json";
import blastBtc from "./blastBtc.json";
import blastEth from "./blastEth.json";
import blastLrts from "./blastLrts.json";
import blastMwstethWpunks20 from "./blastMwstethWpunks20.json";
import blastTestnet from "./blastTestnet.json";
import blastUsdb from "./blastUsdb.json";
import bnbBnb from "./bnbBnb.json";
import bnbBtc from "./bnbBtc.json";
import bnbEzetheth from "./bnbEzetheth.json";
import bnbStone from "./bnbStone.json";
import bnbWeethfundamental from "./bnbWeethfundamental.json";
import bobMultiPriceFeed from "./bobMultiPriceFeed.json";
import cadenceCantoAtom from "./cadenceCantoAtom.json";
import cadenceCantoCanto from "./cadenceCantoCanto.json";
import cadenceCantoCnote from "./cadenceCantoCnote.json";
import cadenceCantoEth from "./cadenceCantoEth.json";
import cadenceCantoTestnet from "./cadenceCantoTestnet.json";
import cadenceCantoUsdc from "./cadenceCantoUsdc.json";
import cadenceCantoUsdt from "./cadenceCantoUsdt.json";
import cyberEth from "./cyberEth.json";
import ethereumApxetheth from "./ethereumApxetheth.json";
import ethereumC3m from "./ethereumC3m.json";
import ethereumEtherfiWeeth from "./ethereumEtherfiWeeth.json";
import ethereumEtherfiWeetheth from "./ethereumEtherfiWeetheth.json";
import ethereumEthpluseth from "./ethereumEthpluseth.json";
import ethereumEthxeth from "./ethereumEthxeth.json";
import ethereumEusd from "./ethereumEusd.json";
import ethereumEzetheth from "./ethereumEzetheth.json";
import ethereumPufetheth from "./ethereumPufetheth.json";
import ethereumRsetheth from "./ethereumRsetheth.json";
import ethereumRswetheth from "./ethereumRswetheth.json";
import ethereumSfrxetheth from "./ethereumSfrxetheth.json";
import ethereumStakewiseOsetheth from "./ethereumStakewiseOsetheth.json";
import ethereumUsdeSusde from "./ethereumUsdeSusde.json";
import etherlinkGhostnetTezosXtzEthBtc from "./etherlinkGhostnetTezosXtzEthBtc.json";
import etherlinkTezos from "./etherlinkTezos.json";
import fraxtalPackage from "./fraxtalPackage.json";
import lineaEzetheth from "./lineaEzetheth.json";
import lineaWeethfundamental from "./lineaWeethfundamental.json";
import mantaLayerBank from "./mantaLayerBank.json";
import mantleEth from "./mantleEth.json";
import mantleMnt from "./mantleMnt.json";
import mantleTest from "./mantleTest.json";
import mantleUsdeSusde from "./mantleUsdeSusde.json";
import mantleUsdt from "./mantleUsdt.json";
import mantleWstEth from "./mantleWstEth.json";
import mentoBaklavaMultisig from "./mentoBaklavaMultisig.json";
import mentoCeloMainnet from "./mentoCeloMainnet.json";
import merlinMerl from "./merlinMerl.json";
import merlinMultiPriceFeed from "./merlinMultiPriceFeed.json";
import modeLayerBank from "./modeLayerBank.json";
import modeMode from "./modeMode.json";
import modeUsde from "./modeUsde.json";
import realGbp from "./realGbp.json";
import realXau from "./realXau.json";
import seiMultiAdapter from "./seiMultiAdapter.json";
import sepoliaAngleAgeur from "./sepoliaAngleAgeur.json";
import sepoliaVenusXvs from "./sepoliaVenusXvs.json";
import staderEthx from "./staderEthx.json";
import swell from "./swell.json";
import venusBnbTestnet from "./venusBnbTestnet.json";
import venusBnbTrx from "./venusBnbTrx.json";
import venusMainnetXvs from "./venusMainnetXvs.json";
import zksyncZk from "./zksyncZk.json";

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
  arbitrumXvs,
  b2MultiPriceFeed,
  baseUsdplus,
  baseBsdetheth,
  basePufetheth,
  berachainTestnetEth,
  bnbBnb,
  bnbBtc,
  bnbEzetheth,
  bnbStone,
  blastBtc,
  blastEth,
  blastLrts,
  blastMwstethWpunks20,
  blastTestnet,
  blastUsdb,
  bnbWeethfundamental,
  bobMultiPriceFeed,
  cadenceCantoAtom,
  cadenceCantoCanto,
  cadenceCantoCnote,
  cadenceCantoEth,
  cadenceCantoTestnet,
  cadenceCantoUsdc,
  cadenceCantoUsdt,
  cyberEth,
  ethereumApxetheth,
  ethereumC3m,
  ethereumEusd,
  ethereumEthxeth,
  ethereumEtherfiWeeth,
  ethereumEtherfiWeetheth,
  ethereumEthpluseth,
  ethereumEzetheth,
  ethereumPufetheth,
  ethereumRsetheth,
  ethereumRswetheth,
  ethereumStakewiseOsetheth,
  ethereumSfrxetheth,
  ethereumUsdeSusde,
  etherlinkTezos,
  etherlinkGhostnetTezosXtzEthBtc,
  fraxtalPackage,
  lineaEzetheth,
  lineaWeethfundamental,
  mantleEth,
  mantaLayerBank,
  mantleMnt,
  mantleTest,
  mantleUsdeSusde,
  mantleUsdt,
  mantleWstEth,
  mentoBaklavaMultisig,
  mentoCeloMainnet,
  merlinMerl,
  merlinMultiPriceFeed,
  modeLayerBank,
  modeMode,
  modeUsde,
  realGbp,
  realXau,
  seiMultiAdapter,
  sepoliaAngleAgeur,
  sepoliaVenusXvs,
  staderEthx,
  swell,
  venusBnbTestnet,
  venusBnbTrx,
  venusMainnetXvs,
  zksyncZk,
} as Record<string, OnChainRelayerManifest>;
