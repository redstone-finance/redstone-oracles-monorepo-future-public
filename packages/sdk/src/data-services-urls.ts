const DEMO_URL = "https://d33trozg86ya9x.cloudfront.net";

export const REDSTONE_DATA_SERVICES_URLS: Partial<Record<string, string[]>> = {
  "redstone-primary-prod": [
    "https://oracle-gateway-1.a.redstone.finance",
    "https://oracle-gateway-2.a.redstone.finance",
  ],
  "redstone-primary-demo": [DEMO_URL],
  "redstone-avalanche-prod": [
    "https://oracle-gateway-1.a.redstone.finance",
    "https://oracle-gateway-2.a.redstone.finance",
  ],
  "redstone-arbitrum-prod": [
    "https://oracle-gateway-1.a.redstone.finance",
    "https://oracle-gateway-2.a.redstone.finance",
  ],
  "redstone-custom-urls-demo": ["https://d1zm8lxy9v2ddd.cloudfront.net"],
  "redstone-main-demo": [DEMO_URL],
  "redstone-rapid-demo": [DEMO_URL],
  "redstone-stocks-demo": [DEMO_URL],
  "redstone-twaps-demo": [DEMO_URL],
  "redstone-arbitrum-demo": [DEMO_URL],
  "mock-data-service": ["http://localhost:3000"],
  "mock-data-service-tests": ["http://valid-cache.com"],
};

export const resolveDataServiceUrls = (dataServiceId: string): string[] => {
  const urls = REDSTONE_DATA_SERVICES_URLS[dataServiceId];
  if (!urls) {
    throw Error(
      `Data service ${dataServiceId} is not configured by Redstone protocol`
    );
  }

  return urls;
};
