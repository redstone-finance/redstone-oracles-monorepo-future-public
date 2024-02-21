const DEV_GWS = [
  "https://oracle-gateway-1.b.redstone.finance",
  "https://oracle-gateway-1.b.redstone.vip",
];

const PROD_GWS = [
  "https://oracle-gateway-1.a.redstone.finance",
  "https://oracle-gateway-2.a.redstone.finance",
  "https://oracle-gateway-1.a.redstone.vip",
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
