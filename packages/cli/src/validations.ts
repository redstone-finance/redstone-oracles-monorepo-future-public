export const isUrl = (urlMightBe: string) => {
  // for hardhat local testing
  if (urlMightBe.length === 0) {
    return true;
  }
  try {
    new URL(urlMightBe);
    return true;
  } catch {
    return false;
  }
};

export const areFeedsCommaSeparated = (feedsMightBe: string) => {
  const feeds = feedsMightBe.split(",");
  const areAnyWhiteSpaces = feedsMightBe.indexOf(" ") !== -1;
  return feeds.length > 0 && feeds.every(Boolean) && !areAnyWhiteSpaces;
};

export const areRpcUrlsValid = (rpcUrlsMightBe: string) => {
  return rpcUrlsMightBe.split(",").every((rpcUrl) => isUrl(rpcUrl));
};
