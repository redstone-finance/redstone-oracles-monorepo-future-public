import abracadabraKavaBtc from "./abracadabraKavaBtc.json";
import abracadabraKavaEth from "./abracadabraKavaEth.json";
import abracadabraKavaUsdt from "./abracadabraKavaUsdt.json";
import angle from "./angle.json";
import arbitrumPremia from "./arbitrumPremia.json";
import arbitrumAngleAgeur from "./arbitrumAngleAgeur.json";
import arbitrumWeethfundamental from "./arbitrumWeethfundamental.json";
import cadenceCantoTestnet from "./cadenceCantoTestnet.json";
import cadenceCantoAtom from "./cadenceCantoAtom.json";
import cadenceCantoCanto from "./cadenceCantoCanto.json";
import cadenceCantoEth from "./cadenceCantoEth.json";
import cadenceCantoUsdc from "./cadenceCantoUsdc.json";
import cadenceCantoUsdt from "./cadenceCantoUsdt.json";
import ethereumEusd from "./ethereumEusd.json";
import ethereumEthxeth from "./ethereumEthxeth.json";
import ethereumEtherfiWeeth from "./ethereumEtherfiWeeth.json";
import ethereumEtherfiWeetheth from "./ethereumEtherfiWeetheth.json";
import ethereumStakewiseOsetheth from "./ethereumStakewiseOsetheth.json";
import fluidEthTestnet from "./fluidEthTestnet.json";
import gammaBnbTestnet from "./gammaBnbTestnet.json";
import hubble from "./hubble.json";
import hubbleAylinTestnet from "./hubbleAylinTestnet.json";
import hubbleExchangeMainnet from "./hubbleExchangeMainnet.json";
import mantaEth from "./mantaEth.json";
import mantaLayerBank from "./mantaLayerBank.json";
import mantleEth from "./mantleEth.json";
import mantleMnt from "./mantleMnt.json";
import mantleTest from "./mantleTest.json";
import mantleWstEth from "./mantleWstEth.json";
import mentoBaklavaMultisig from "./mentoBaklavaMultisig.json";
import mentoCeloMainnet from "./mentoCeloMainnet.json";
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
import voltzArb from "./voltzArb.json";
import cadenceCantoCnote from "./cadenceCantoCnote.json";
import blastTestnet from "./blastTestnet.json";
import ethereumApxetheth from "./ethereumApxetheth.json";
import ethereumRsetheth from "./ethereumRsetheth.json";
import ethereumEzetheth from "./ethereumEzetheth.json";
import { OnChainRelayerManifest } from "../src";

// This file contains mapping from manifest name to manifest content
// Which can be very useful as a source of truth, and can be easily use
// in JS/TS code. We export it as an object for being able to iterate
// through it and e.g. identify relayer name by an adapter address
export default {
  blastTestnet,
  abracadabraKavaBtc,
  abracadabraKavaEth,
  abracadabraKavaUsdt,
  angle,
  arbitrumPremia,
  arbitrumAngleAgeur,
  arbitrumWeethfundamental,
  cadenceCantoAtom,
  cadenceCantoCanto,
  cadenceCantoCnote,
  cadenceCantoEth,
  cadenceCantoTestnet,
  cadenceCantoUsdc,
  cadenceCantoUsdt,
  ethereumApxetheth,
  ethereumEusd,
  ethereumEthxeth,
  ethereumEtherfiWeeth,
  ethereumEtherfiWeetheth,
  ethereumEzetheth,
  ethereumRsetheth,
  ethereumStakewiseOsetheth,
  fluidEthTestnet,
  gammaBnbTestnet,
  hubble,
  hubbleAylinTestnet,
  hubbleExchangeMainnet,
  mantaEth,
  mantleEth,
  mantaLayerBank,
  mantleMnt,
  mantleTest,
  mantleWstEth,
  mentoBaklavaMultisig,
  mentoCeloMainnet,
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
  voltzArb,
} as Record<string, OnChainRelayerManifest>;
