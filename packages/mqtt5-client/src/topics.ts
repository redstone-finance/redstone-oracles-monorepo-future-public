export type DataPackageTopic = {
  dataServiceId: string;
  dataPackageId: string;
  nodeAddress: string;
};

// 100 req/s is mqtt limit per connection
// 1 topic(dataFeedId,signer) produces => 3 (main,fallback,fast) feed per second
// prod: 30 feeds x 5 signers => 5 connections
// dev: 30 feeds x 2 signers => 2 connections
export function calculateTopicCountPerConnection(): number {
  return Math.floor(100 / 3);
}

export function encodeDataPackageTopic({
  dataServiceId,
  dataPackageId,
  nodeAddress,
}: DataPackageTopic) {
  return encodeTopic([
    "data-package",
    dataServiceId,
    dataPackageId,
    nodeAddress,
  ]);
}

export function decodeDataPackageTopic(encodedTopic: string): DataPackageTopic {
  const [_, dataServiceId, dataPackageId, nodeAddress] =
    decodeTopic(encodedTopic);

  return {
    dataServiceId,
    dataPackageId,
    nodeAddress,
  };
}

export const encodeTopic = (parts: string[]) => {
  const encodedParts = [];

  let index = 0;
  for (const part of parts) {
    if (part === "+" || part === "#") {
      encodedParts.push(part);
    } else if (part.startsWith("$") && index === 0) {
      encodedParts.push(part);
    } else {
      encodedParts.push(encodeURIComponent(part));
    }
    index++;
  }

  return encodedParts.join("/");
};

export const decodeTopic = (topic: string) => {
  const parts = [];
  const encodedParts = topic.split("/");

  let index = 0;
  for (const encodedPart of encodedParts) {
    if (encodedPart === "+" || encodedPart === "#") {
      parts.push(encodedPart);
    } else if (encodedPart.startsWith("$") && index === 0) {
      parts.push(encodedPart);
    } else {
      parts.push(decodeURIComponent(encodedPart));
    }
    index++;
  }

  return parts.join("/");
};
