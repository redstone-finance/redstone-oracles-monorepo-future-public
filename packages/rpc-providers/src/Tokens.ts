import { SupportedNetworkNames } from "@redstone-finance/chain-configs";

type TokenInfo = {
  symbol: string;
  address: string;
  decimals: number;
};

export function getTokenInfo(
  networkName: SupportedNetworkNames,
  symbol: string
): TokenInfo {
  const networkTokens = chainTokenMap[networkName];
  if (!networkTokens) {
    throw new Error(`Chain ${networkName} not found in chainTokenMap`);
  }
  if (!Object.keys(networkTokens).includes(symbol)) {
    throw new Error(
      `Token ${symbol} not found on ${networkName}, check getTokenInfo function`
    );
  }
  const token = networkTokens[symbol];
  const tokenInfo: TokenInfo = {
    symbol: symbol,
    ...token,
  };
  return tokenInfo;
}

export type TokenMap = {
  [symbol: string]: {
    address: string;
    decimals: number;
  };
};

type ChainTokenMap = {
  [networkName in SupportedNetworkNames]?: TokenMap;
};

// ERC20 tokens must provide decimals in smart contract
export const chainTokenMap: ChainTokenMap = {
  ethereum: {
    GHO: {
      address: "0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f",
      decimals: 18,
    },
    USDC: {
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      decimals: 6,
    },
    USDT: {
      address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      decimals: 6,
    },
    WETH: {
      address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      decimals: 18,
    },
    weETH: {
      address: "0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee",
      decimals: 18,
    },
    rETH: {
      address: "0xae78736Cd615f374D3085123A210448E74Fc6393",
      decimals: 18,
    },
    osETH: {
      address: "0xf1c9acdc66974dfb6decb12aa385b9cd01190e38",
      decimals: 18,
    },
    SWETH: {
      address: "0xf951e335afb289353dc249e82926178eac7ded78",
      decimals: 18,
    },
    OHM: {
      address: "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5",
      decimals: 9,
    },
    BAL: {
      address: "0xba100000625a3754423978a60c9317c58a424e3D",
      decimals: 18,
    },
    ETHx: {
      address: "0xA35b1B31Ce002FBF2058D22F30f95D405200A15b",
      decimals: 18,
    },
    AURA: {
      address: "0xc0c293ce456ff0ed870add98a0828dd4d2903dbf",
      decimals: 18,
    },
    wstETH: {
      address: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
      decimals: 18,
    },
    pxETH: {
      address: "0x04C154b66CB340F3Ae24111CC767e0184Ed00Cc6",
      decimals: 18,
    },
    ezETH: {
      address: "0xbf5495efe5db9ce00f80364c8b423567e58d2110",
      decimals: 18,
    },
    rsETH: {
      address: "0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7",
      decimals: 18,
    },
    DAI: {
      address: "0x6b175474e89094c44da98b954eedeac495271d0f",
      decimals: 18,
    },
    LUSD: {
      address: "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
      decimals: 18,
    },
    frxETH: {
      address: "0x5E8422345238F34275888049021821E8E08CAa1f",
      decimals: 18,
    },
    rswETH: {
      address: "0xFAe103DC9cf190eD75350761e95403b7b8aFa6c0",
      decimals: 18,
    },
    AAVE: {
      address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
      decimals: 18,
    },
    WBTC: {
      address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      decimals: 8,
    },
    pufETH: {
      address: "0xd9a442856c234a39a81a089c06451ebaa4306a72",
      decimals: 18,
    },
    FRAX: {
      address: "0x853d955acef822db058eb8505911ed77f175b99e",
      decimals: 18,
    },
    crvUSD: {
      address: "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e",
      decimals: 18,
    },
    CRV: {
      address: "0xd533a949740bb3306d119cc777fa900ba034cd52",
      decimals: 18,
    },
    USDe: {
      address: "0x4c9edd5852cd905f086c759e8383e09bff1e68b3",
      decimals: 18,
    },
    stETH: {
      address: "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
      decimals: 18,
    },
    ALUSD: {
      address: "0xbc6da0fe9ad5f3b0d58160288917aa56653660e9",
      decimals: 18,
    },
    eUSD: {
      address: "0xa0d69e286b938e21cbf7e51d71f6a4c8918f482f",
      decimals: 18,
    },
    USDM: {
      address: "0x59d9356e565ab3a36dd77763fc0d87feaf85508c",
      decimals: 18,
    },
    agEUR: {
      address: "0x1a7e4e63778b4f12a199c062f3efdd288afcbce8",
      decimals: 18,
    },
    "ETH+": {
      address: "0xe72b141df173b999ae7c1adcbf60cc9833ce56a8",
      decimals: 18,
    },
    ETH: {
      address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      decimals: 18,
    },
    crvFRAX: {
      address: "0x3175df0976dfa876431c2e9ee6bc45b65d3473cc",
      decimals: 18,
    },
    "3Crv": {
      address: "0x6c3f90f043a72fa612cbac8115ee7e52bde6e490",
      decimals: 18,
    },
    EUROC: {
      address: "0x1abaea1f7c830bd89acc67ec4af516284b1bc33c",
      decimals: 6,
    },
    sDAI: {
      address: "0x83f20f44975d03b1b09e64809b757c47f942beea",
      decimals: 18,
    },
    CVX: {
      address: "0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b",
      decimals: 18,
    },
    RSR: {
      address: "0x320623b8e4ff03373931769a31fc52a4e78b5d70",
      decimals: 18,
    },
    sfrxETH: {
      address: "0xac3e018457b222d93114458476f3e3416abbe38f",
      decimals: 18,
    },
    ALETH: {
      address: "0x0100546f2cd4c9d97f798ffc9755e47865ff7ee6",
      decimals: 18,
    },
    "mwstETH-WPUNKS:20": {
      address: "0xC975342A95cCb75378ddc646B8620fa3Cd5bc051",
      decimals: 18,
    },
    MKR: {
      address: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
      decimals: 18,
    },
    SHIB: {
      address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
      decimals: 18,
    },
    PEPE: {
      address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
      decimals: 18,
    },
    DYDX: {
      address: "0x92D6C1e31e14520e676a687F0a93788B716BEff5",
      decimals: 18,
    },
    MNT: {
      address: "0x3c3a81e81dc49A522A592e7622A7E711c06bf354",
      decimals: 18,
    },
    UNI: {
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      decimals: 18,
    },
    LINK: {
      address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
      decimals: 18,
    },
    FXS: {
      address: "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
      decimals: 18,
    },
    sUSDe: {
      address: "0x9d39a5de30e57443bff2a8307a4256c8797a3497",
      decimals: 18,
    },
    PREMIA: {
      address: "0x6399c842dd2be3de30bf99bc7d1bbf6fa3650e70",
      decimals: 18,
    },
    USD3: {
      address: "0x0d86883FAf4FfD7aEb116390af37746F45b6f378",
      decimals: 18,
    },
    deUSD: {
      address: "0x15700B564Ca08D9439C58cA5053166E8317aa138",
      decimals: 18,
    },
    pzETH: {
      address: "0x8c9532a60E0E7C6BbD2B2c1303F63aCE1c3E9811",
      decimals: 18,
    },
    SolvBTC: {
      address: "0x7A56E1C57C7475CCf742a1832B028F0456652F97",
      decimals: 18,
    },
    "SolvBTC.BBN": {
      address: "0xd9D920AA40f578ab794426F5C90F6C731D159DEf",
      decimals: 18,
    },
    cbBTC: {
      address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      decimals: 8,
    },
    FDUSD: {
      address: "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409",
      decimals: 18,
    },
    fxUSD: {
      address: "0x085780639CC2cACd35E474e71f4d000e2405d8f6",
      decimals: 18,
    },
    aUSD: {
      address: "0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a",
      decimals: 6,
    },
  },
  blast: {
    ETH: {
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
    },
    USDB: {
      address: "0x4300000000000000000000000000000000000003",
      decimals: 18,
    },
    WETH: {
      address: "0x4300000000000000000000000000000000000004",
      decimals: 18,
    },
    FWWETH: {
      address: "0x66714db8f3397c767d0a602458b5b4e3c0fe7dd1",
      decimals: 18,
    },
    FWUSDB: {
      address: "0x866f2c06b83df2ed7ca9c2d044940e7cd55a06d6",
      decimals: 18,
    },
    "mwstETH-WPUNKS:20": {
      address: "0x9a50953716bA58e3d6719Ea5c437452ac578705F",
      decimals: 18,
    },
    ezETH: {
      address: "0x2416092f143378750bb29b79eD961ab195CcEea5",
      decimals: 18,
    },
  },
  arbitrumOne: {
    WETH: {
      address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      decimals: 18,
    },
    wstETH: {
      address: "0x5979d7b546e38e414f7e9822514be443a4800529",
      decimals: 18,
    },
    PREMIA: {
      address: "0x51fc0f6660482ea73330e414efd7808811a57fa2",
      decimals: 18,
    },
    FRAX: {
      address: "0x17fc002b466eec40dae837fc4be5c67993ddbd6f",
      decimals: 18,
    },
    VST: {
      address: "0x64343594ab9b56e99087bfa6f2335db24c2d1f17",
      decimals: 18,
    },
    ARB: {
      address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      decimals: 18,
    },
    "USDC.e": {
      address: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
      decimals: 6,
    },
    WBTC: {
      address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
      decimals: 8,
    },
    MAGIC: {
      address: "0x539bde0d7dbd336b79148aa742883198bbf60342",
      decimals: 18,
    },
    USDC: {
      address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      decimals: 6,
    },
    DAI: {
      address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      decimals: 18,
    },
    JUSDC: {
      address: "0xe66998533a1992ece9ea99cdf47686f4fc8458e0",
      decimals: 18,
    },
    PLS: {
      address: "0x51318b7d00db7acc4026c88c3952b66278b6a67f",
      decimals: 18,
    },
    JGLP: {
      address: "0x7241bc8035b65865156ddb5edef3eb32874a3af6",
      decimals: 18,
    },
    USDT: {
      address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
      decimals: 6,
    },
    PRIME: {
      address: "0x3De81CE90f5A27C5E6A5aDb04b54ABA488a6d14E",
      decimals: 18,
    },
    weETH: {
      address: "0x35751007a407ca6feffe80b3cb397736d2cf4dbe",
      decimals: 18,
    },
    rETH: {
      address: "0xec70dcb4a1efa46b8f2d97c310c9c4790ba5ffa8",
      decimals: 18,
    },
    ezETH: {
      address: "0x2416092f143378750bb29b79ed961ab195cceea5",
      decimals: 18,
    },
    rsETH: {
      address: "0x4186bfc76e2e237523cbc30fd220fe055156b41f",
      decimals: 18,
    },
    crvUSD: {
      address: "0x498bf2b1e120fed3ad3d42ea2165e9b73f99c1e5",
      decimals: 18,
    },
    "SolvBTC.ENA": {
      address: "0xaFAfd68AFe3fe65d376eEC9Eab1802616cFacCb8",
      decimals: 18,
    },
    "USD+": {
      address: "0xe80772Eaf6e2E18B651F160Bc9158b2A5caFCA65",
      decimals: 6,
    },
    SolvBTC: {
      address: "0x3647c54c4c2C65bC7a2D63c0Da2809B399DBBDC0",
      decimals: 18,
    },
    GHO: {
      address: "0x7dff72693f6a4149b17e7c6314655f6a9f7c8b33",
      decimals: 18,
    },
    osETH: {
      address: "0xf7d4e7273e5015c96728a6b02f31c505ee184603",
      decimals: 18,
    },
    agEUR: {
      address: "0xFA5Ed56A203466CbBC2430a43c66b9D8723528E7",
      decimals: 18,
    },
    ETHx: {
      address: "0xED65C5085a18Fa160Af0313E60dcc7905E944Dc7",
      decimals: 18,
    },
  },
  avalanche: {
    USDC: {
      address: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
      decimals: 6,
    },
    EUROC: {
      address: "0xc891eb4cbdeff6e073e859e987815ed1505c2acd",
      decimals: 6,
    },
    WAVAX: {
      address: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
      decimals: 18,
    },
    JOE: {
      address: "0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd",
      decimals: 18,
    },
    PNG: {
      address: "0x60781c2586d68229fde47564546784ab3faca982",
      decimals: 18,
    },
    QI: {
      address: "0x8729438eb15e2c8b576fcc6aecda6a148776c0f5",
      decimals: 18,
    },
    PTP: {
      address: "0x22d4002028f537599be9f666d1c4fa138522f9c8",
      decimals: 18,
    },
    XAVA: {
      address: "0xd1c3f94de7e5b45fa4edbba472491a9f4b166fc4",
      decimals: 18,
    },
    YAK: {
      address: "0x59414b3089ce2af0010e7523dea7e2b35d776ec7",
      decimals: 18,
    },
    "USDT.e": {
      address: "0xc7198437980c041c805a1edcba50c1ce5db95118",
      decimals: 6,
    },
    GMX: {
      address: "0x62edc0692bd897d2295872a9ffcac5425011c661",
      decimals: 18,
    },
    PRIME: {
      address: "0x33C8036E99082B0C395374832FECF70c42C7F298",
      decimals: 18,
    },
    SolvBTC: {
      address: "0xbc78D84Ba0c46dFe32cf2895a19939c86b81a777",
      decimals: 18,
    },
    "SolvBTC.BBN": {
      address: "0xCC0966D8418d412c599A6421b760a847eB169A8c",
      decimals: 18,
    },
    "BTC.b": {
      address: "0x152b9d0FdC40C096757F570A51E494bd4b943E50",
      decimals: 8,
    },
    USDT: {
      address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
      decimals: 6,
    },
    aUSD: {
      address: "0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a",
      decimals: 6,
    },
  },
  merlin: {
    SolvBTC_MERLIN: {
      address: "0x41d9036454be47d3745a823c4aacd0e29cfb0f71",
      decimals: 18,
    },
    "M-BTC": {
      address: "0xb880fd278198bd590252621d4cd071b1842e9bcd",
      decimals: 18,
    },
    SolvBTC: {
      address: "0x41D9036454BE47d3745A823C4aaCD0e29cFB0f71",
      decimals: 18,
    },
  },
  canto: {
    USDC: {
      address: "0x80b5a32E4F032B2a058b4F29EC95EEfEEB87aDcd",
      decimals: 6,
    },
    NOTE: {
      address: "0x4e71A2E537B7f9D9413D3991D37958c0b5e1e503",
      decimals: 18,
    },
    USDT: {
      address: "0xd567B3d7B8FE3C79a1AD8dA978812cfC4Fa05e75",
      decimals: 6,
    },
    WCANTO: {
      address: "0x826551890Dc65655a0Aceca109aB11AbDbD7a07B",
      decimals: 18,
    },
    ATOM: {
      address: "0xecEEEfCEE421D8062EF8d6b4D814efe4dc898265",
      decimals: 6,
    },
    ETH: {
      address: "0x5FD55A1B9FC24967C4dB09C513C3BA0DFa7FF687",
      decimals: 18,
    },
  },
  base: {
    USDC: {
      address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      decimals: 6,
    },
    eUSD: {
      address: "0xcfa3ef56d303ae4faaba0592388f19d7c3399fb4",
      decimals: 18,
    },
    RSR: {
      address: "0xaB36452DbAC151bE02b16Ca17d8919826072f64a",
      decimals: 18,
    },
    WETH: {
      address: "0x4200000000000000000000000000000000000006",
      decimals: 18,
    },
    bsdETH: {
      address: "0xCb327b99fF831bF8223cCEd12B1338FF3aA322Ff",
      decimals: 18,
    },
    "USD+": {
      address: "0xB79DD08EA68A908A97220C76d19A6aA9cBDE4376",
      decimals: 6,
    },
    wstETH: {
      address: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452",
      decimals: 18,
    },
    fBOMB: {
      address: "0x74ccbe53F77b08632ce0CB91D3A545bF6B8E0979",
      decimals: 18,
    },
    cbBTC: {
      address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      decimals: 8,
    },
  },
  optimism: {
    USDC: {
      address: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
      decimals: 6,
    },
    ALUSD: {
      address: "0xCB8FA9a76b8e203D8C3797bF438d8FB81Ea3326A",
      decimals: 18,
    },
    OP: {
      address: "0x4200000000000000000000000000000000000042",
      decimals: 18,
    },
    LUSD: {
      address: "0xc40F949F8a4e094D1b49a23ea9241D289B7b2819",
      decimals: 18,
    },
    WETH: {
      address: "0x4200000000000000000000000000000000000006",
      decimals: 18,
    },
    ALETH: {
      address: "0x3E29D3A9316dAB217754d13b28646B76607c5f04",
      decimals: 18,
    },
    frxETH: {
      address: "0x6806411765Af15Bddd26f8f544A34cC40cb9838B",
      decimals: 18,
    },
    FRAX: {
      address: "0x2E3D870790dC77A83DD1d18184Acc7439A53f475",
      decimals: 18,
    },
    wstETH: {
      address: "0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb",
      decimals: 18,
    },
    ezETH: {
      address: "0x2416092f143378750bb29b79ed961ab195cceea5",
      decimals: 18,
    },
    sfrxETH: {
      address: "0x484c2d6e3cdd945a8b2df735e079178c1036578c",
      decimals: 18,
    },
    rETH: {
      address: "0x9bcef72be871e61ed4fbbc7630889bee758eb81d",
      decimals: 18,
    },
    fBOMB: {
      address: "0x74ccbe53F77b08632ce0CB91D3A545bF6B8E0979",
      decimals: 18,
    },
  },
  manta: {
    WETH: {
      address: "0x0dc808adce2099a9f62aa87d9670745aba741746",
      decimals: 18,
    },
    "LAB.m": {
      address: "0x20a512dbdc0d006f46e6ca11329034eb3d18c997",
      decimals: 18,
    },
  },
  bnb: {
    BTCB: {
      address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
      decimals: 18,
    },
    "SolvBTC.ENA": {
      address: "0x53E63a31fD1077f949204b94F431bCaB98F72BCE",
      decimals: 18,
    },
    SolvBTC: {
      address: "0x4aae823a6a0b376De6A78e74eCC5b079d38cBCf7",
      decimals: 18,
    },
    "SolvBTC.BBN": {
      address: "0x1346b618dC92810EC74163e4c27004c921D446a5",
      decimals: 18,
    },
    WBNB: {
      address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      decimals: 18,
    },
    USDT: {
      address: "0x55d398326f99059fF775485246999027B3197955",
      decimals: 18,
    },
    FDUSD: {
      address: "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409",
      decimals: 18,
    },
    ETH: {
      address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
      decimals: 18,
    },
  },
  sei: {
    WSEI: {
      address: "0xE30feDd158A2e3b13e9badaeABaFc5516e95e8C7",
      decimals: 18,
    },
    ISEI: {
      address: "0x5Cf6826140C1C56Ff49C808A1A75407Cd1DF9423",
      decimals: 6,
    },
    USDC: {
      address: "0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1",
      decimals: 6,
    },
  },
};

export const allTokenSymbols: Set<string> = new Set(
  Object.values(chainTokenMap)
    .flatMap((tokenMap) => Object.keys(tokenMap))
    .map((symbol) => symbol.toLowerCase())
);
