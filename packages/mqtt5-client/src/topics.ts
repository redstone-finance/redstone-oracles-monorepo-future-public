export type DataPackageTopic = {
  dataServiceId: string;
  dataPackageId: string;
  nodeAddress: string;
};

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
