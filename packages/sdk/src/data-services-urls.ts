const DEV_GWS = [
  "https://oracle-gateway-1.b.redstone.vip",
  "https://oracle-gateway-1.b.redstone.finance",
];

const STAGING_GWS = ["https://read-ext-oracle-gateway.b.redstone.finance"];

const PROD_GWS = [
  "https://oracle-gateway-1.a.redstone.vip",
  "https://oracle-gateway-1.a.redstone.finance",
  "https://oracle-gateway-2.a.redstone.finance",
];

export const REDSTONE_DATA_SERVICES_URLS: Partial<Record<string, string[]>> = {
  "redstone-primary-prod": PROD_GWS,
  "redstone-avalanche-prod": PROD_GWS,
  "redstone-arbitrum-prod": PROD_GWS,
  "redstone-primary-demo": DEV_GWS,
  "redstone-main-demo": DEV_GWS,
  "redstone-rapid-demo": DEV_GWS,
  "redstone-fast-demo": DEV_GWS,
  "redstone-stocks-demo": DEV_GWS,
  "redstone-avalanche-demo": DEV_GWS,
  "redstone-arbitrum-demo": DEV_GWS,
  "mock-data-service": ["http://localhost:3000"],
  "mock-data-service-tests": ["http://valid-cache.com"],
  "redstone-external-demo-1": STAGING_GWS,
  "kudasaijp-demo-1": STAGING_GWS,
  "teb-demo-1": STAGING_GWS,
};

export const resolveDataServiceUrls = (dataServiceId: string): string[] => {
  const urls = REDSTONE_DATA_SERVICES_URLS[dataServiceId];
  if (!urls) {
    throw Error(
      `Data service ${dataServiceId} is not configured by RedStone protocol`
    );
  }

  return urls;
};
