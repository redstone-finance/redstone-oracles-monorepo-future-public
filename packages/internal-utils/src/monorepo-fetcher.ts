export const fetchFromMonorepo = async (filePath: string): Promise<string> => {
  const cloudFrontUrl = `https://d3cu28sut4ahjk.cloudfront.net/redstone-finance/redstone-monorepo-priv/main/${filePath}`;

  const response = await fetch(cloudFrontUrl);

  if (!response.ok) {
    throw new Error(
      `Fetching from monorepo failed. Status: ${response.status}`
    );
  }

  const data = await response.text();

  return data;
};
